use image::ImageFormat;
use image::imageops::FilterType;
use std::io::Cursor;

pub struct PreparedImage {
    pub bytes: Vec<u8>,
    pub mime: &'static str,
}

pub fn prepare(bytes: &[u8], original_mime: &'static str, max_side: u32) -> PreparedImage {
    let original = || PreparedImage {
        bytes: bytes.to_vec(),
        mime: original_mime,
    };
    let Ok(decoded) = image::load_from_memory(bytes) else {
        return original();
    };
    if max_side == 0 || (decoded.width() <= max_side && decoded.height() <= max_side) {
        return original();
    }
    let resized = decoded
        .resize(max_side, max_side, FilterType::Triangle)
        .to_rgb8();
    let mut out = Cursor::new(Vec::new());
    match resized.write_to(&mut out, ImageFormat::Jpeg) {
        Ok(()) => PreparedImage {
            bytes: out.into_inner(),
            mime: "image/jpeg",
        },
        Err(_) => original(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{Rgb, RgbImage};

    fn jpeg(width: u32, height: u32) -> Vec<u8> {
        let mut out = Cursor::new(Vec::new());
        RgbImage::from_pixel(width, height, Rgb([40, 120, 60]))
            .write_to(&mut out, ImageFormat::Jpeg)
            .unwrap();
        out.into_inner()
    }

    #[test]
    fn large_images_are_scaled_to_the_longest_side() {
        let prepared = prepare(&jpeg(2000, 1000), "image/jpeg", 768);
        let decoded = image::load_from_memory(&prepared.bytes).unwrap();
        assert_eq!((decoded.width(), decoded.height()), (768, 384));
        assert_eq!(prepared.mime, "image/jpeg");
    }

    #[test]
    fn small_images_and_undecodable_bytes_pass_through() {
        let small = jpeg(300, 200);
        assert_eq!(prepare(&small, "image/jpeg", 768).bytes, small);
        assert_eq!(
            prepare(b"not an image", "image/png", 768).bytes,
            b"not an image"
        );
    }
}
