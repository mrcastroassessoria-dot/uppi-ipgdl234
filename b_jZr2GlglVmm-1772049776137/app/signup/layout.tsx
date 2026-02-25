export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ width: "100%", height: "100dvh", display: "flex", flexDirection: "column" }}>
      {children}
    </main>
  )
}
