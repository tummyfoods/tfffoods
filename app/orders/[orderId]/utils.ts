export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatPrice = (price: number): string => {
  return price.toFixed(2);
}; 