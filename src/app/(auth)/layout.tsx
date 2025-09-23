export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://raw.githubusercontent.com/gaolamthuy/logo/refs/heads/main/logo-main-hexagon-extrawhiteborder-forproductimage.svg"
            alt="Gạo Lâm Thúy"
            className="h-32 w-32 mb-2"
          />
          <div className="text-xl font-bold">Gạo Lâm Thúy</div>
          <div className="text-sm text-muted-foreground">Portal</div>
        </div>
        {children}
      </div>
    </div>
  );
}
