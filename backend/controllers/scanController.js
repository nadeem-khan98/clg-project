import axios from 'axios';

export const scanProduct = async (req, res) => {
  const { barcode } = req.params;

  try {
    // Fetch from OpenFoodFacts
    const { data } = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

    if (data.status === 1 && data.product) {
      const p = data.product;
      const nutriments = p.nutriments || {};
      
      const productData = {
        productName: p.product_name || 'Unknown Product',
        calories: nutriments['energy-kcal_100g'] || 0,
        protein: nutriments['proteins_100g'] || 0,
        fat: nutriments['fat_100g'] || 0,
        sugar: nutriments['sugars_100g'] || 0
      };

      res.json(productData);
    } else {
      res.status(404).json({ message: 'Product not found in OpenFoodFacts database' });
    }
  } catch (error) {
    console.error('OpenFoodFacts API error:', error);
    res.status(500).json({ message: 'Error fetching product data' });
  }
};
