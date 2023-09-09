const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do MySQL
const connection = require('./config.js');

app.use(express.json());

// Configuração do Multer para upload de arquivos CSV
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload-csv', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo CSV enviado.' });
  }

  const csvData = req.file.buffer.toString('utf8');

  const results = [];
  csvParser({ delimiter: ',' })
    .on('data', (data) => results.push(data))
    .on('end', () => {
      return res.json({ message: 'Arquivo CSV carregado com sucesso.', data: results });
    });
});

app.post('/validate', (req, res) => {
  const { products } = req.body;

  const validationErrors = [];
  for (const product of products) {
    if (!product.code || !product.name || !product.cost_price || !product.sales_price) {
      validationErrors.push(`Produto inválido: ${product.code}`);
    }
    if (product.cost_price > product.sales_price) {
      validationErrors.push(`Preço de venda menor que o custo: ${product.code}`);
    }
    
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  return res.json({ message: 'Dados validados com sucesso.' });
});

app.post('/update-prices', (req, res) => {
  const { products } = req.body;

  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao iniciar a transação no banco de dados.' });
    }

    for (const product of products) {
        const { code, sales_price } = product;

      connection.query(
        'UPDATE products SET sales_price = ? WHERE code = ?',
        [sales_price, code],
        (error, results) => {
          if (error) {
            connection.rollback();
            return res.status(500).json({ error: 'Erro ao atualizar o preço do produto.' });
          }
        }
      );
    }

    connection.commit((err) => {
      if (err) {
        connection.rollback();
        return res.status(500).json({ error: 'Erro ao confirmar a transação no banco de dados.' });
      }

      return res.json({ message: 'Preços atualizados com sucesso.' });
    });
  });
});

// Rota para verificar a existência do código do produto no banco de dados
app.get('/check-product/:code', (req, res) => {
    const { code } = req.params;
  
    connection.query(
      'SELECT * FROM products WHERE code = ?',
      [code],
      (error, results) => {
        if (error) {
          return res.status(500).json({ error: 'Erro na consulta ao banco de dados.' });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'Código do produto não encontrado.' });
        }
  
   
        const productData = results[0];
        return res.json(productData);
      }
    );
  });
  
  // Rota para atualizar o preço do produto no banco de dados
  app.post('/update-price/:code', (req, res) => {
    const { code } = req.params;
    const { newPrice } = req.body;
  
    
    connection.query(
      'UPDATE products SET sales_price = ? WHERE code = ?',
      [newPrice, code],
      (error, results) => {
        if (error) {
          return res.status(500).json({ error: 'Erro na atualização do preço do produto.' });
        }
  
        return res.json({ message: 'Preço atualizado com sucesso.' });
      }
    );
  });
  

app.listen(port, () => {
  console.log(`Servidor está ouvindo na porta ${port} 🚀`);
});
