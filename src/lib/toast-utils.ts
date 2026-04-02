import toast from "react-hot-toast";

export interface ToastOptions {
  duration?: number;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

/**
 * Custom toast utilities with beautiful styling
 */
export const useToast = () => {
  return {
    success: (message: string, options?: ToastOptions) => {
      return toast.success(message, {
        duration: options?.duration ?? 4000,
        position: options?.position as any ?? "bottom-center",
      });
    },

    error: (message: string, options?: ToastOptions) => {
      return toast.error(message, {
        duration: options?.duration ?? 5000,
        position: options?.position as any ?? "bottom-center",
      });
    },

    loading: (message: string = "Loading...", options?: ToastOptions) => {
      return toast.loading(message, {
        duration: options?.duration ?? Infinity,
        position: options?.position as any ?? "bottom-center",
      });
    },

    promise: async <T,>(
      promise: Promise<T>,
      {
        loading: loadingMessage,
        success: successMessage,
        error: errorMessage,
      }: {
        loading: string;
        success: string;
        error: string;
      },
      options?: ToastOptions
    ) => {
      return toast.promise(
        promise,
        {
          loading: loadingMessage,
          success: successMessage,
          error: errorMessage,
        },
        {
          duration: options?.duration ?? 4000,
          position: options?.position as any ?? "bottom-center",
        }
      );
    },

    custom: (component: React.ReactNode | (() => React.ReactNode), options?: ToastOptions) => {
      if (typeof component === "function") {
        return toast.custom(component as any, {
          duration: options?.duration ?? 4000,
          position: options?.position as any ?? "bottom-center",
        });
      }
      return toast.custom((() => component) as any, {
        duration: options?.duration ?? 4000,
        position: options?.position as any ?? "bottom-center",
      });
    },

    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    },
  };
};
