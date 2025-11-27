export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background px-4 py-3">
      <div className="flex items-center justify-center text-center text-sm text-muted-foreground">
        <p data-testid="text-copyright">
          &copy; {currentYear} Digital Doctors Assistant. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
