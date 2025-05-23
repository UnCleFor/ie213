import { Row } from "antd";
import styled from "styled-components";

export const ColorFooter = styled.div`
  color: #fff;
  background-color: #000;
`
export const FooterContainer = styled(Row)`
  background-color: #000;
  color: #fff;
  padding: 40px 0px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
`;

export const FooterSection = styled.div`
  flex: 1;
  min-width: auto;
  margin-bottom: 20px;
`;

export const FooterTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
`;

export const FooterLink = styled.a`
  display: block;
  color: #fff;
  text-decoration: none;
  margin-bottom: 10px;
  font-size: 14px;
  cursor: pointer; 
  &:hover {
    color: brown;
  }
`;

export const SubscribeSection = styled.div`
  flex: 1;
  margin-bottom: 20px;
`;

export const FooterBottom = styled.div`
  width: 100%;
  border-top: 1px solid #fff;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
`;

export const SocialIcons = styled.div`
  display: flex;
  align-items: center;
  
  a {
    color: #fff;
    font-size: 24px;  
    margin-left: 15px;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  a:hover {
    color: #ddd; 
  }
`;

export const ContactInfo = styled.div`
  p {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin: 5px 0;

    i {
      margin-right: 10px;
      font-size: 14px;
    }
  }
`;