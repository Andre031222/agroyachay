use std::path::{Component, Path, PathBuf};

use crate::error::AppError;

pub const MAX_IMAGE_BYTES: usize = 8 * 1024 * 1024;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ImageKind {
    Jpeg,
    Png,
    Webp,
}

impl ImageKind {
    pub fn detect(bytes: &[u8]) -> Option<Self> {
        if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
            Some(Self::Jpeg)
        } else if bytes.starts_with(&[0x89, b'P', b'N', b'G', 0x0D, 0x0A, 0x1A, 0x0A]) {
            Some(Self::Png)
        } else if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
            Some(Self::Webp)
        } else {
            None
        }
    }

    pub fn extension(&self) -> &'static str {
        match self {
            Self::Jpeg => "jpg",
            Self::Png => "png",
            Self::Webp => "webp",
        }
    }

    pub fn mime(&self) -> &'static str {
        match self {
            Self::Jpeg => "image/jpeg",
            Self::Png => "image/png",
            Self::Webp => "image/webp",
        }
    }

    pub fn from_extension(path: &str) -> Option<Self> {
        match Path::new(path).extension()?.to_str()? {
            "jpg" | "jpeg" => Some(Self::Jpeg),
            "png" => Some(Self::Png),
            "webp" => Some(Self::Webp),
            _ => None,
        }
    }
}

#[derive(Clone, Debug)]
pub struct Storage {
    root: PathBuf,
}

impl Storage {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn validate_image(bytes: &[u8]) -> Result<ImageKind, AppError> {
        if bytes.len() > MAX_IMAGE_BYTES {
            return Err(AppError::PayloadTooLarge);
        }
        ImageKind::detect(bytes).ok_or(AppError::UnsupportedMediaType)
    }

    fn resolve(&self, relative: &str) -> Result<PathBuf, AppError> {
        let candidate = Path::new(relative);
        let safe = candidate
            .components()
            .all(|component| matches!(component, Component::Normal(_)));
        if !safe {
            return Err(AppError::NotFound);
        }
        Ok(self.root.join(candidate))
    }

    pub async fn save_image(
        &self,
        folder: &str,
        bytes: &[u8],
        kind: ImageKind,
    ) -> Result<String, AppError> {
        let relative = format!("{folder}/{}.{}", uuid::Uuid::new_v4(), kind.extension());
        let path = self.resolve(&relative)?;
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(AppError::internal)?;
        }
        tokio::fs::write(&path, bytes)
            .await
            .map_err(AppError::internal)?;
        Ok(relative)
    }

    pub async fn read(&self, relative: &str) -> Result<Vec<u8>, AppError> {
        let path = self.resolve(relative)?;
        tokio::fs::read(&path).await.map_err(|_| AppError::NotFound)
    }

    pub async fn delete(&self, relative: &str) {
        if let Ok(path) = self.resolve(relative)
            && let Err(error) = tokio::fs::remove_file(&path).await
        {
            tracing::warn!(%error, path = %path.display(), "could not delete upload");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn magic_bytes_are_recognised() {
        assert_eq!(
            ImageKind::detect(&[0xFF, 0xD8, 0xFF, 0xE0]),
            Some(ImageKind::Jpeg)
        );
        assert_eq!(
            ImageKind::detect(b"\x89PNG\r\n\x1a\n0000"),
            Some(ImageKind::Png)
        );
        assert_eq!(
            ImageKind::detect(b"RIFF\0\0\0\0WEBPVP8 "),
            Some(ImageKind::Webp)
        );
        assert_eq!(ImageKind::detect(b"GIF89a"), None);
        assert_eq!(ImageKind::detect(b"<svg"), None);
    }

    #[test]
    fn oversized_or_unknown_files_are_rejected() {
        assert!(matches!(
            Storage::validate_image(b"%PDF-1.7"),
            Err(AppError::UnsupportedMediaType)
        ));
        let huge = vec![0xFF; MAX_IMAGE_BYTES + 1];
        assert!(matches!(
            Storage::validate_image(&huge),
            Err(AppError::PayloadTooLarge)
        ));
    }

    #[tokio::test]
    async fn path_traversal_is_refused() {
        let storage = Storage::new(std::env::temp_dir());
        assert!(matches!(
            storage.read("../etc/passwd").await,
            Err(AppError::NotFound)
        ));
    }
}
