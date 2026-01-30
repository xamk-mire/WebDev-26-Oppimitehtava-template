import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div className="navbar bg-base-300 shadow neon">
      <div className="flex-1 text-xl font-bold px-4">Plant Dashboard</div>
      <div className="flex-none px-4">
        {user && (
          <div className="flex items-center gap-3">
            <span>{user.name ?? user.email}</span>
            <button className="btn btn-sm btn-outline" onClick={logout}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
