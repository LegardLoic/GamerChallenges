import Layout from '../Layout/Layout'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import HomePage from '../../pages/HomePage/HomePage'
import { Routes, Route } from 'react-router'
import LoginPage from '../../pages/LoginPage/LoginPage'
export default function App (){
    return (
        <Layout Header={<Header />} Footer={<Footer />}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </Layout>
    )
}