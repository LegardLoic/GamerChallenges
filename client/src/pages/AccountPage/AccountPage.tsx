import { useSelector } from 'react-redux';
import './AccountPage.css'
import type { RootState } from '@/store';
export default function AccountPage () {
    const { userInfo, loading, error } = useSelector(
        (store: RootState) => store.userStore
    );
  return (
    <>
      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p>une erreur est survenu</p>
      ) : (
        <div className="container mt-5">
          <h1 className="mb-2">Account Page</h1>
          <div className="row">
            <div className="col-12">
              <div className="card text-center">
                <div className="card-header">
                  Informations du compte
                </div>
                <div className="card-body text-start">
                  <div className="container d-flex justify-content-around flex-column flex-md-row">
                    <div>
                      <p> <strong>Prenom :</strong> {userInfo?.firstname}</p>
                      <p> <strong>Nom de famille :</strong> {userInfo?.lastname}</p>
                      <p> <strong>Email :</strong> {userInfo?.email}</p>
                    </div>
                    <div>
                      <p> <strong>Role :</strong> {userInfo?.role}</p>
                      <p> <strong>Avatar :</strong> {userInfo?.avatarUrl}</p>
                    </div>  
                  </div>
                </div>
                <div className="card-footer text-body-secondary">
                  <button type="button" className="btn btn-success me-2">Modifier le compte</button>
                  <button type="button" className="btn btn-danger">Supprimer le compte</button>
                </div>
              </div>
            </div>
            <div className="col-12 mt-5">
              <div className="card text-center">
                <div className="card-header">
                  Mes derniers challenges
                </div>
                <div className="card-body">
                  {userInfo?.role !== "author" ? (
                    <p>Votre role ne vous permet pas de creer un challenge. Optenez le role <strong>Createur</strong> des maintenant !</p>
                  ) : userInfo?.challenge?.length == 0 ? (
                    <p>Pas de challenges créer sur votre compte</p>
                  ) : (
                    <div className="container text-center">
                      <div className="row justify-content-center">
                        {userInfo?.challenge?.map((challenge) => (
                          <div key={challenge.id} className="col-12 col-md-6 col-lg-4">
                            <div className="card card-reservation">
                              <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn1.epicgames.com%2Foffer%2F9773aa1aa54f4f7b80e44bef04986cea%2FEGS_RocketLeague_PsyonixLLC_S1_2560x1440-80c4a256c751819a0739c0224fa5c15a&f=1&nofb=1&ipt=26961739e28ec8097c8c66b7fcebe16a1f40cdf240163bcba2ad672e9fdd5b41" className="card-img-top" alt="..."/>
                              <div className="card-body">
                                <h5 className="card-title">{challenge.name}</h5>
                                <p className="card-text">{challenge.description}</p>
                                <a href="#" className="btn btn-primary">Go somewhere</a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
                <div className="card-footer text-body-secondary">
                  {userInfo?.role !== "author" ? (
                    <button type="button" className="btn btn-warning me-2">Devenez Créateur</button>
                  ) : (
                    <button type="button" className="btn btn-info me-2">Creer un challenge</button>
                  )}
                  {userInfo?.challenge?.length !== 0 ? (
                    <button type="button" className="btn btn-primary me-2">Tous mes challenges</button>
                  ) : (
                    null
                  )} 
                </div>
              </div>
            </div>
            <div className="col-12 mt-5">
              <div className="card text-center">
                <div className="card-header">
                  Mes dernières participations
                </div>
                <div className="card-body">
                  {userInfo?.participation?.length == 0 ? (
                    <p>Vous n'avez participer à aucun challenge pour le moment</p>
                  ) : (
                    <div className="container text-center">
                      <div className="row justify-content-center">
                        {userInfo?.participation?.map((participation)=>(
                          <div className="col-12 col-md-6 col-lg-4">
                            <div className="card card-reservation">
                              <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpapers.com%2Fimages%2Fhd%2Fcrash-bandicoot-forest-bhouy7ry5gmx3uk5.jpg&f=1&nofb=1&ipt=ce2685399788fbff7cd899f2eab1014d3e4963a4ddaed0dc175651b9dea5d6fa" className="card-img-top" alt="..."/>
                              <div className="card-body">
                                <h5 className="card-title">{participation.time}</h5>
                                <p className="card-text">{participation.comment}</p>
                                <a href="#" className="btn btn-primary">Go somewhere</a>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="col-12 col-md-6 col-lg-4">
                          <div className="card card-reservation">
                            <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimg.youtube.com%2Fvi%2FOpCooWm-PDs%2Fmaxresdefault.jpg&f=1&nofb=1&ipt=5b79ce23d83daafd22195ff7e14321ec958a68535bc6efe4183c3514598449da" className="card-img-top" alt="..."/>
                            <div className="card-body">
                              <h5 className="card-title">Card title</h5>
                              <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card’s content.</p>
                              <a href="#" className="btn btn-primary">Go somewhere</a>
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-4">
                          <div className="card card-reservation">
                            <img src="https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fimages1.wikia.nocookie.net%2F__cb20110703115107%2Fzelda%2Fes%2Fimages%2F9%2F94%2FOcarina_of_Time.png&f=1&nofb=1&ipt=66f41a86c57c9340941f22170cfdbfc6706a2b294d9cd63732d89f18c1d55181" className="card-img-top" alt="..."/>
                            <div className="card-body">
                              <h5 className="card-title">Card title</h5>
                              <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card’s content.</p>
                              <a href="#" className="btn btn-primary">Go somewhere</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-footer text-body-secondary">
                  <button type="button" className="btn btn-info me-2">Voir la liste des challenges</button>
                  <button type="button" className="btn btn-primary me-2">Toutes mes participations</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}  
      
    </>    
  )
}