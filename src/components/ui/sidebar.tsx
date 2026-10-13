import { cn } from "cn";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as unknown as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "hidden md:block shrink-0 relative",
        "my-4 md:my-6 lg:my-8 ml-3 md:ml-5 lg:ml-22",
      )}
      style={{
        height: "calc(100vh - 160px)",
        position: "sticky",
        top: "90px",
        alignSelf: "flex-start",
        zIndex: 40,
      }}
      animate={{
        width: animate ? (open ? "240px" : "80px") : "240px",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className={cn(
          "flex flex-col shrink-0 rounded-3xl",
          "bg-white/85 dark:bg-[#0f172a]/90 backdrop-blur-xl",
          "border border-[#083695]/10 dark:border-white/10",
          "shadow-xl shadow-[#083695]/10 dark:shadow-black/40",
          "px-3 py-4 overflow-hidden transition-colors duration-300",
          "absolute top-0 left-0",
          className,
        )}
        style={{
          width: "100%",
          height: "calc(100vh - 160px)",
        }}
        {...props}
      >
        {children}
      </motion.div>

      {/* Floating expand / collapse toggle — sits on the sidebar's right edge */}
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute top-5 -right-3 z-50 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#1e293b] text-[#083695] dark:text-white border border-[#083695]/15 dark:border-white/15 shadow-md hover:bg-[#083695]/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {open ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />}
      </motion.button>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" {...props}>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 250,
            }}
            className={cn(
              "fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl shadow-2xl p-6 flex flex-col justify-between border-r border-[#083695]/10 dark:border-white/10 z-50",
              className,
            )}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
              className="absolute right-4 top-4 p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-[#083695]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <IconX size={20} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      onClick={link.onClick}
      className={cn(
        "flex items-center gap-2 group/sidebar py-2",
        open ? "justify-start" : "justify-center",
        className,
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-[#083695] dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block p-0! m-0!"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
