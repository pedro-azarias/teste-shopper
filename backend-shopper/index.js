const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const mysql = require('mysql2');
const util = require('util')
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Configuração do MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Mysqlpass@2023',
  database: 'ecommerce_db',
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    throw err;
  }
  console.log('Conectado ao MySQL com sucesso!');
});

const queryAsync = util.promisify(connection.query).bind(connection);
const executeAsync = util.promisify(connection.execute).bind(connection);

// Configuração do Multer para upload de arquivos CSV
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const groupProductsMap = {
  1000: [{ productCode: 18, quantity: 6 }],
  1010: [{ productCode: 26, quantity: 1 }, { productCode: 24, quantity: 1 }],
  1020: [{ productCode: 19, quantity: 3 }, { productCode: 21, quantity: 3 }],
};
app.use(express.json());
app.use(upload.single('csvFile'));



app.post('/upload-csv', (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo CSV enviado.' });
  }

  const csvData = req.file.buffer.toString('utf8');
  const results = [];

  csvParser({ delimiter: ',' })
    .on('data', (data) => {
      const productCode = data.product_code;
      const newPrice = parseFloat(data.new_price.replace(',', '').replace(' ', ''));

      if (!isNaN(newPrice)) {
        results.push([productCode, newPrice]);
      }
    })
    .on('end', () => {
      return res.json({ message: 'Arquivo CSV carregado com sucesso.', data: results });
    });
});

// Rota para buscar informações de um produto por código
app.get('/get-product/:code', (req, res) => {
  const productCode = req.params.code;


  connection.query(
    'SELECT * FROM products WHERE code = ?',
    [productCode],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erro ao buscar informações do produto.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      const productData = results[0];
      return res.json(productData);
    }
  );
});



// Rota para buscar o preço atual de um produto por código
app.get('/get-current-price/:code', (req, res) => {
  const productCode = req.params.code;


  connection.query(
    'SELECT sales_price FROM products WHERE code = ?',
    [productCode],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erro ao buscar preço atual do produto.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      const currentPrice = results[0].sales_price;
      return res.json({ sales_price: currentPrice });
    }
  );
});






// Rota para buscar o custo de um produto por código
app.get('/get-cost-price/:code', (req, res) => {
  const productCode = req.params.code;

  connection.query(
    'SELECT cost_price FROM products WHERE code = ?',
    [productCode],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Erro ao buscar custo do produto.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      const costPrice = results[0].cost_price;
      return res.json({ cost_price: costPrice });
    }
  );
});



async function updateGroupPrice(groupCode) {
  const transaction = await connection.promise().begin();

  try {
    let totalPrice = 0;

    
    if (!groupProductsMap[groupCode]) {
      console.error(`Grupo ${groupCode} não encontrado no mapeamento.`);
      await transaction.rollback();
      return;
    }


    const groupProducts = groupProductsMap[groupCode];

    for (const { productCode, quantity } of groupProducts) {
      const [results] = await queryAsync('SELECT sales_price FROM products WHERE code = ?', [productCode]);

      if (results.length > 0) {
        const individualPrice = results[0].sales_price;
        console.log(`Preço individual do produto ${productCode}: ${individualPrice}`);
        totalPrice += parseFloat(individualPrice) * quantity;
      } else {
        console.error(`Produto com código ${productCode} não encontrado.`);
      }
    }

    console.log(`Valor de totalPrice para o Grupo ${groupCode}:`, totalPrice);

    
    await transaction.execute('UPDATE products SET sales_price = ? WHERE code = ?', [totalPrice, groupCode]);
    await transaction.commit();

    console.log(`Preço do Grupo ${groupCode} atualizado com sucesso.`);
  } catch (error) {
    console.error(`Erro ao atualizar o preço do Grupo ${groupCode}.`, error);
    await transaction.rollback();
    throw error;
  }
}


app.post('/update-prices', async (req, res) => {
  const productsToUpdate = req.body.products;

  if (!Array.isArray(productsToUpdate) || productsToUpdate.length === 0) {
    return res.status(400).json({ error: 'Nenhum dado de atualização fornecido.' });
  }

  const updateErrors = [];

 
  const groupUpdates = {};

  for (const { code, newPrice } of productsToUpdate) {
    try {
    
      for (const groupCode in groupProductsMap) {
        if (groupProductsMap.hasOwnProperty(groupCode)) {
          const groupProducts = groupProductsMap[groupCode];
          const productInGroup = groupProducts.find((product) => product.productCode === code);

          if (productInGroup) {
            if (!(groupCode in groupUpdates)) {
              groupUpdates[groupCode] = 0;
            }
            groupUpdates[groupCode] += parseFloat(newPrice) * productInGroup.quantity;
          }
        }
      }

    
      await executeAsync('UPDATE products SET sales_price = ? WHERE code = ?', [newPrice, code]);
    } catch (error) {
      console.error(`Erro ao atualizar preço do produto ${code}: ${error.message}`);
      updateErrors.push(`Erro ao atualizar preço do produto ${code}: ${error.message}`);
    }
  }

 
  for (const groupCode in groupUpdates) {
    if (groupUpdates.hasOwnProperty(groupCode)) {
      try {
        await executeAsync('UPDATE products SET sales_price = ? WHERE code = ?', [groupUpdates[groupCode], groupCode]);
      } catch (error) {
        console.error(`Erro ao atualizar preço do grupo ${groupCode}: ${error.message}`);
        updateErrors.push(`Erro ao atualizar preço do grupo ${groupCode}: ${error.message}`);
      }
    }
  }

  if (updateErrors.length > 0) {
    return res.status(500).json({ error: 'Erro ao atualizar preços.', errors: updateErrors });
  }

  return res.json({ message: 'Preços atualizados com sucesso.' });
});



app.post('/update-component-price', async (req, res) => {
  const { code, newPrice } = req.body;

  try {
   
    await connection.execute(
      'UPDATE products SET sales_price = ? WHERE code = ?',
      [newPrice, code]
    );

    return res.json({ message: 'Preço do componente atualizado com sucesso.' });
  } catch (error) {
    console.error(`Erro ao atualizar preço do componente ${code}: ${error.message}`);
    return res.status(500).json({ error: `Erro ao atualizar preço do componente ${code}: ${error.message}` });
  }
});




app.listen(port, () => {
  console.log(`Servidor está ouvindo na porta ${port} 🚀`);
});
