import type { ILayoutProps } from "@/@types/layout";
import '../../styles/layout.css'

export default function Layout ({Header , children, Footer}: ILayoutProps){
    // C'est ici qu'on défini les elements que composera chaque page du site : un Header, un Main (children) et un Footer
    // Le children sera le fichier jsx passé dans la route défini dans AppRouter.jsx
    // exemple : Si mon url est http://localhost:5173/produits/rateaux le jsx passé dans children sera Produits.jsx
    // rdv dans src/components/Header.jsx ;)
    return(
        <div className="body">
            {Header}
            <div className="main">
                {children}
            </div>
            
            {Footer}
        </div>
    )
}