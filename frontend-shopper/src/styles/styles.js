import styled from 'styled-components';

export const Container = styled.div`
  background-color: #ffffff;
`;

export const NavBar = styled.nav`
  border: solid 0.5px black;
  width: 100vw;
  height: 80px;
  background-color: #1e2044;
`;

export const ShopperLogo = styled.img`
  width: 250px;
  margin-left: 80px;
  margin-top: -34px;
`;

export const NavParagraph = styled.p`
  display: block;
  margin: 0 auto;
  color: white;
  margin-top: -80px;
  margin-left: 60%;
`;

export const NavLink = styled.a`
  color: white;
`;

export const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const H1 = styled.h1`
  display: block;
  margin: 0 auto;
  text-align: center;
  font-size: 32px;
  margin-top: 10px;
  margin-bottom: 15px;
`;

export const FileInput = styled.input`
  display: block;
  margin: 0 auto;
  margin-bottom: 15px;
`;

export const Table = styled.table`
  border: 1px solid black;
  width: 75%;
  border-collapse: collapse;
  text-align: center;
  table-layout: fixed;
  margin-top: 10px;
`;

export const Tbody = styled.tbody``;

export const Thead = styled.thead``;

export const Tr = styled.tr`
  &:nth-child(even) {
    background-color: #f2f2f2;
  }
`;

export const Th = styled.th`
  padding: 10px;
  background-color: #1e2044;
  color: white;
`;

export const Td = styled.td`
  padding: 10px;
  border: 1px solid black;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-evenly; 
  width: 60%; 
  margin-top: 10px;
  position: absolute;
  margin-top: 35%;

`;

export const ValidateButton = styled.button`
  width: 170px;
  height: 60px;
`;

export const UpdateButton = styled.button`
  width: 170px;
  height: 60px;
`;

export const MessageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => (props.error ? "red" : "green")};
  border: 2px solid ${(props) => (props.error ? 'red' : 'green')};
  color: white;
  width: 100%;
  height: 50px;
  font-size: 18px;
  position: absolute;
  top: 0;
  left: 0;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 15px;
  background-color: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;

  &:hover {
    color: #ff0000; 
  }
`;

export const Message = ({ text, error }) => {
  return <MessageContainer error={error}>{text}</MessageContainer>;
};

