import styled from 'styled-components'
import './App.css'
import Appbar from './components/Appbar'
import CreateIcon from '@mui/icons-material/Create';
import PreviewIcon from '@mui/icons-material/Preview';
import Input from './components/Input';

function App() {

  return (
    <>
      <Appbar />
      <AppContainer>
        <Description>
          コンパス履歴書を最速で作成しようぜ！というWebアプリです。
        </Description>
        <H2><CreateIcon style={{ paddingRight: "0.3em" }} />項目入力</H2>
        <Input />
        <H2><PreviewIcon style={{ paddingRight: "0.3em" }} />プレビュー</H2>
      </AppContainer >
    </>
  )
}

const AppContainer = styled.div`
  padding: 20px 20px;
`

const Description = styled.p`
  
`

const H2 = styled.h2`
  font-size: 1.4rem;
  padding: 10px 0 5px 5px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: "6px",
`

export default App
