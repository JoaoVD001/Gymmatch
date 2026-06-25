import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-card !text-foreground !border-border !rounded-2xl !shadow-lg",
          title: "!text-sm !font-semibold",
          description: "!text-muted-foreground !text-xs",
          success: "!border-l-[3px] !border-l-success",
          error: "!border-l-[3px] !border-l-destructive",
          info: "!border-l-[3px] !border-l-primary",
          warning: "!border-l-[3px] !border-l-[oklch(0.78_0.18_60)]",
          actionButton: "!bg-primary !text-primary-foreground !rounded-full !text-xs",
          cancelButton: "!bg-muted !text-muted-foreground !rounded-full !text-xs",
          closeButton: "!bg-card !border-border !text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
