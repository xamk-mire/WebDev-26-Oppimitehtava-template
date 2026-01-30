import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email, password);
      nav('/');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Wrong email or password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Login</h2>
          {err && <div className="alert alert-error">{err}</div>}
          <form className="space-y-3" onSubmit={submit}>
            <input
              className="input input-bordered w-full"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input input-bordered w-full"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="card-actions justify-end">
              <button
                className={`btn btn-primary ${busy ? 'loading' : ''}`}
                disabled={busy}
              >
                Login
              </button>
            </div>
          </form>
          <p className="text-sm">
            No account?{' '}
            <Link to="/register" className="link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
