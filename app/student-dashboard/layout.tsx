// The student dashboard now draws its own header (see page.tsx), so this layout only passes children through.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
