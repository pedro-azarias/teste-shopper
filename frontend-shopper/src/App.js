
import React, { useState } from "react";
import GlobalStyle from "./styles/global";
import axios from "axios";

import {
    Container,
    NavBar,
    ShopperLogo,
    NavParagraph,
    NavLink,
    Main,
    H1,
    FileInput,
    Table,
    Thead,
    Tbody,
    Th,
    Tr,
    Td,
    ButtonContainer,
    ValidateButton,
    UpdateButton,
    MessageContainer,
    CloseButton
} from "./styles/styles";
import img from "./shopper-removebg-preview.png";

const App = () => {
    const [tableData, setTableData] = useState([]);
    const [csvData, setCsvData] = useState(null);
    const [message, setMessage] = useState({ text: "", error: false });


    const handleFileInputChange = async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target.result;
            const rows = content.split("\n");
            const data = rows.map((row) => {
                const parts = row.split(",").map((value) => value.trim());

                if (parts.length >= 2) {
                    const [productCode, newPrice] = parts;
                    const parsedPrice = parseFloat(newPrice.replace(',', '').replace(' ', ''));

                    if (!isNaN(parsedPrice)) {
                        return [productCode, parsedPrice.toString()];
                    }
                }

                return null;
            });

            const filteredData = data.filter((row) => row !== null);

            setCsvData(filteredData);

           
            const updatedTableData = [];
            for (const [productCode, newPrice] of filteredData) {
                try {
                    const response = await axios.get(`http://localhost:3000/get-product/${productCode}`);
                    const productData = response.data;

                    const product = {
                        code: productCode,
                        name: productData.name || "",
                        currentPrice: !isNaN(productData.sales_price) ? parseFloat(productData.sales_price).toFixed(2) : "",
                        newPrice: parseFloat(newPrice),
                    };

                    updatedTableData.push(product);
                } catch (error) {
                    console.error(`Erro ao buscar informações do produto: ${error.message}`);
                }
            }

            setTableData(updatedTableData);
        };

        reader.readAsText(file);
    };

    const [isTableValid, setIsTableValid] = useState(false);

    const handleValidate = async () => {
        if (!csvData || csvData.length === 0) {
            setMessage({ text: "Nenhum arquivo CSV carregado.", error: true });
            setIsTableValid(false); 
            return;
        }
    
        const validationErrors = [];
    
        const validationPromises = csvData.map(async (row, index) => {
            const [code, newPrice] = row;
    
            try {
                const response = await axios.get(`http://localhost:3000/get-cost-price/${code}`);
                const costPrice = parseFloat(response.data.cost_price);
    
                if (parseFloat(newPrice) < costPrice) {
                    validationErrors.push(`Linha ${index + 1}: Novo preço menor que o custo.`);
                }
    
                const currentPriceResponse = await axios.get(`http://localhost:3000/get-current-price/${code}`);
                const currentPrice = parseFloat(currentPriceResponse.data.sales_price);
    
                const upperLimit = currentPrice * 1.1;
                const lowerLimit = currentPrice * 0.9;
    
                if (parseFloat(newPrice) < lowerLimit || parseFloat(newPrice) > upperLimit) {
                    validationErrors.push(`Linha ${index + 1}: Reajuste fora dos limites de 10%.`);
                }
            } catch (error) {
                validationErrors.push(`Linha ${index + 1}: Erro ao buscar informações do produto: ${error.message}`);
            }
        });
    
        await Promise.all(validationPromises);
    
        if (validationErrors.length > 0) {
            setMessage({ text: "Erros de validação:\n" + validationErrors.join("\n"), error: true });
            setIsTableValid(false); 
        } else {
            setMessage({ text: "Dados validados com sucesso.", error: false });
            setIsTableValid(true); 
        }
    };
    
    
    
    const handleUpdate = async () => {
        console.log("Conteúdo do arquivo CSV:", csvData);
    
        if (!csvData || csvData.length === 0) {
            setMessage({ text: "Nenhum arquivo CSV carregado.", error: true });
            return;
        }
    
        try {
          
            if (Array.isArray(csvData) && csvData.length > 0) {
             
                const productsToUpdate = [];
    
              
                for (const csvRow of csvData) {
                    if (Array.isArray(csvRow) && csvRow.length === 2) {
                        const productCode = csvRow[0];
                        const newPrice = csvRow[1];
              
                        productsToUpdate.push({ code: parseInt(productCode), newPrice: parseFloat(newPrice) });
                    }
                }
    
             
                if (productsToUpdate.length === 0) {
                    setMessage({ text: "Nenhum produto válido encontrado no CSV.", error: true });
                    return;
                }
    
                const response = await axios.post('http://localhost:3000/update-prices', {
                    products: productsToUpdate.map((product) => ({
                        code: product.code,
                        newPrice: product.newPrice,
                    })),
                });
    
               
                if (response.data && response.data.message === 'Preços atualizados com sucesso.') {
                    
                    setCsvData([]);
                    setMessage({ text: "Preços atualizados com sucesso.", error: false });
                } else {
                    setMessage({ text: "Erro ao atualizar preços.", error: true });
                }
            } else {
                setMessage({ text: "Nenhum dado válido encontrado no arquivo CSV.", error: true });
            }
        } catch (error) {
            setMessage({ text: `Erro ao atualizar preços: ${error.message}`, error: true });
        }
    };
    
    
    
    


    
      
      
      
      
      
    
    
    

    return (
        <Container>
            <NavBar>
                <ShopperLogo src={img}></ShopperLogo>
                <NavParagraph>
                    Desenvolvido por{" "}
                    <NavLink href="https://linkedin.com/in/pedro-henrique-azarias-de-paiva" target="_blank">Pedro Henrique Azarias de Paiva</NavLink>
                </NavParagraph>
            </NavBar>

            <Main>
                <GlobalStyle />
                <H1>Atualização de preços</H1>
                <FileInput type="file" accept=".csv" onChange={handleFileInputChange} />

                <Table>
                    <Thead>
                        <Tr>
                            <Th>Código</Th>
                            <Th>Nome</Th>
                            <Th>Preço atual</Th>
                            <Th>Preço novo</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {csvData &&
                            csvData.map((row, index) => (
                                <Tr key={index}>
                                    <Td>{row[0]}</Td>
                                    <Td>{tableData[index] && tableData[index].name}</Td>
                                    <Td>{tableData[index] && tableData[index].currentPrice}</Td>
                                    <Td>{tableData[index] && tableData[index].newPrice}</Td>
                                </Tr>
                            ))}
                    </Tbody>
                </Table>

                <ButtonContainer>
          <ValidateButton onClick={handleValidate}>Validar</ValidateButton>
          <UpdateButton onClick={handleUpdate} disabled={!isTableValid}>
            Atualizar
          </UpdateButton>
        </ButtonContainer>
        {message.text && (
          <MessageContainer error={message.error}>
            {message.text}
            <CloseButton onClick={() => setMessage({ text: "", error: false })}>
              Fechar
            </CloseButton>
          </MessageContainer>
        
      )}
            </Main>
        </Container>
    );
};

export default App;
