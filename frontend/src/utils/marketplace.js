export const categoryLabel = (t, value) => {
  if (!value) return '';
  const key = `marketplace.categories.${value}`;
  const label = t(key);
  return label === key ? value : label;
};
