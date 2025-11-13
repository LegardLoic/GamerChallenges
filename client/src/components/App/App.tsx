import Layout from '../Layout/Layout'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import HomePage from '../../pages/HomePage/HomePage'
import { Routes, Route } from 'react-router'
import LoginPage from '../../pages/LoginPage/LoginPage'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { getUserInfo } from '@/store/reducers/userReducer'
import type { RootState, AppDispatch } from "@/store";
import AccountPage from '@/pages/AccountPage/AccountPage'
export default function App (){
    
    const dispatch = useDispatch<AppDispatch>();
    const { isAuth, userInfo, loading, error } = useSelector(
        (store: RootState) => store.userStore
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await dispatch(getUserInfo());
            } catch (error) {
                console.log("Authentication failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

    checkAuth();
  }, [dispatch]);
    return (
        <Layout Header={<Header />} Footer={<Footer />}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/account" element={<AccountPage />} />
            </Routes>
        </Layout>
    )
}