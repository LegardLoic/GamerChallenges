import { useDispatch } from 'react-redux'
import { login } from "@/store/reducers/userReducer";
import { useNavigate } from 'react-router';
import type { AppDispatch } from '@/store';
import type { IloginFormData } from '@/@types/user';



export default function LoginPage () {

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    async function submitForm(data: IloginFormData){
        const result = await dispatch(login(data));
        if (login.fulfilled.match(result)) {
            navigate("/");
        }
    }
    return (
        <div className="container">
            <h2>Login</h2>
            <form action={(formData) => {
                const loginFormData = {
                    email: formData.get("email") as string,
                    password: formData.get("password") as string
                }
                submitForm(loginFormData)
            }}>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <input type="email" name="email" className="form-control" placeholder="exemple@email.com" id="email" aria-describedby="emailHelp"/>
                    <div id="emailHelp" className="form-text">Vous ne devez jamais partager votre adresse mail.</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" name="password" className="form-control" id="password"/>
                </div>
                <div className="mb-3 form-check">
                    <input type="checkbox" className="form-check-input" id="exampleCheck1"/>
                    <label className="form-check-label" htmlFor="exampleCheck1">Check me out</label>
                </div>
                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>       
    )
}