export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-80">
        <h1 className="text-xl font-bold mb-4">Login</h1>
        <form className="space-y-3">
          <input type="email" placeholder="Email"
            className="w-full border px-3 py-2 rounded" />
          <input type="password" placeholder="Password"
            className="w-full border px-3 py-2 rounded" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

