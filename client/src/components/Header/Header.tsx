import { NavLink } from "react-router";
import "../../styles/header.css"
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function Header () {
    const { isAuth, userInfo, loading } = useSelector(
        (store: RootState) => store.userStore
    );
    return (
        <nav className="navbar navbar-expand-lg bg-body-header text-white">
            <div className="container-fluid">
                <div className="logo-container">
                    <a className="navbar-brand" href="#"><span aria-hidden="true" className="logo-mask" /></a>
                </div>
                
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav ms-auto me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <NavLink
                                to={`/`}
                                end
                                className={'nav-link active text-white'}
                            >
                                Accueil
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink
                                to={`/challenges`}
                                end
                                className={'nav-link text-white'}
                            >
                                Les challenges
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link text-white" href="#">autres</a>
                        </li>
                    </ul>
                    
                    <p></p>
                    <div className="nav-item dropdown me-5">
                        <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Mon Compte
                        </a>
                        
                        <ul className="dropdown-menu">
                            {loading ? (
                                <p>chargement</p>
                              ) : !isAuth ? (
                                <>
                                  <li>
                                    <NavLink
                                      to={`/login`}
                                      end
                                      className={'dropdown-item'}
                                    >
                                      Connexion
                                    </NavLink>
                                  </li>
                                  <li>
                                    <NavLink
                                      to={`/register`}
                                      end
                                      className={'dropdown-item'}
                                    >
                                      inscription
                                    </NavLink>
                                  </li> 
                                </>
                                 
                              ) : (
                                <>
                                  <li>
                                    <p className="dropdown-item">Hello {userInfo?.firstname}</p>
                                  </li>
                                  <li><hr className="dropdown-divider"/></li>
                                  <li>
                                    <NavLink
                                      to={`/account`}
                                      end
                                      className={'dropdown-item'}
                                    >
                                      Mon compte
                                    </NavLink>
                                  </li>
                                  <li>
                                    <NavLink
                                      to={`/logout`}
                                      end
                                      className={'dropdown-item'}
                                    >
                                      Deconnexion
                                    </NavLink>
                                  </li> 
                                </>
                              )
                            }
                            
                            {/* <li><hr className="dropdown-divider"/></li>
                            <li><a className="dropdown-item" href="#">Something else here</a></li> */}
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    )
}