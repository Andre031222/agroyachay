use rust_xlsxwriter::{Format, Workbook};

use crate::error::AppError;

#[derive(Clone, Debug)]
pub enum Cell {
    Text(String),
    Number(f64),
    Empty,
}

impl From<&str> for Cell {
    fn from(value: &str) -> Self {
        Self::Text(value.to_string())
    }
}

impl From<String> for Cell {
    fn from(value: String) -> Self {
        Self::Text(value)
    }
}

impl From<f64> for Cell {
    fn from(value: f64) -> Self {
        Self::Number(value)
    }
}

impl From<Option<String>> for Cell {
    fn from(value: Option<String>) -> Self {
        value.map(Self::Text).unwrap_or(Self::Empty)
    }
}

impl From<Option<f64>> for Cell {
    fn from(value: Option<f64>) -> Self {
        value.map(Self::Number).unwrap_or(Self::Empty)
    }
}

pub struct Sheet {
    pub name: String,
    pub headers: Vec<String>,
    pub rows: Vec<Vec<Cell>>,
}

pub fn build(sheets: Vec<Sheet>) -> Result<Vec<u8>, AppError> {
    let mut workbook = Workbook::new();
    let header_format = Format::new().set_bold();
    for sheet in sheets {
        let worksheet = workbook.add_worksheet();
        worksheet
            .set_name(sheet.name.chars().take(31).collect::<String>())
            .map_err(AppError::internal)?;
        for (column, header) in sheet.headers.iter().enumerate() {
            worksheet
                .write_string_with_format(0, column as u16, header.as_str(), &header_format)
                .map_err(AppError::internal)?;
        }
        for (row_index, row) in sheet.rows.iter().enumerate() {
            let row_number = row_index as u32 + 1;
            for (column, cell) in row.iter().enumerate() {
                match cell {
                    Cell::Text(text) => {
                        worksheet
                            .write_string(row_number, column as u16, text.as_str())
                            .map_err(AppError::internal)?;
                    }
                    Cell::Number(number) if number.is_finite() => {
                        worksheet
                            .write_number(row_number, column as u16, *number)
                            .map_err(AppError::internal)?;
                    }
                    _ => {}
                }
            }
        }
        worksheet
            .set_freeze_panes(1, 0)
            .map_err(AppError::internal)?;
        worksheet.autofit();
    }
    workbook.save_to_buffer().map_err(AppError::internal)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn workbook_is_a_zip_container() {
        let bytes = build(vec![Sheet {
            name: "Test".into(),
            headers: vec!["a".into(), "b".into()],
            rows: vec![vec!["x".into(), 1.5.into()], vec![Cell::Empty, 2.0.into()]],
        }])
        .unwrap();
        assert!(bytes.starts_with(b"PK"));
    }
}
