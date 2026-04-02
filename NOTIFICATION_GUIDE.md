# Beautiful Animated Notification System - Usage Guide

## Overview
Your ecommerce app now features a **beautiful, animated toast notification system** with smooth animations, color-coded messages, and glassmorphic design.

## Features

✨ **Beautiful Design**
- Glassmorphic panels with backdrop blur
- Gradient backgrounds for each notification type
- Smooth animations and transitions
- Icon animations (checkmark, alert, spinner, etc.)
- Responsive and mobile-friendly

🎬 **Smooth Animations**
- Enter animations: Slide up + scale (300ms)
- Exit animations: Slide down + scale (200ms)
- Hover effects: Scale up and lift
- Icon animations: Rotating spinner, pulsing alerts
- Shimmer effects on success/error notifications

🎨 **Color-coded Notifications**
- **Success**: Green gradient (emerald/green)
- **Error**: Red gradient (rose/red)
- **Loading**: Blue gradient (cyan/blue)
- **Info**: Blue gradient (sky blue)

## Usage

### Method 1: Direct toast.js imports (Recommended)

```tsx
import toast from "react-hot-toast";

// Success notification
toast.success("Order created successfully!");

// Error notification
toast.error("Something went wrong!");

// Loading notification
const id = toast.loading("Processing your payment...");

// Dismiss the loading toast
toast.dismiss(id);
```

### Method 2: Using the useToast Hook

```tsx
"use client";
import { useToast } from "@/lib/toast-utils";

export default function MyComponent() {
  const toast = useToast();

  const handleAction = async () => {
    // Success
    toast.success("Action completed!");

    // Error
    toast.error("Failed to complete action");

    // Loading with automatic dismissal
    const loadingId = toast.loading("Processing...");
    
    // Dismiss later
    toast.dismiss(loadingId);
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

### Method 3: Using Promise Patterns

```tsx
import { useToast } from "@/lib/toast-utils";

const toast = useToast();

const myPromise = fetch("/api/something");

toast.promise(myPromise, {
  loading: "Processing...",
  success: "Success!",
  error: "Failed!",
});
```

### Method 4: Custom Notification Components

```tsx
import { SuccessNotification, ErrorNotification, LoadingNotification } from "@/components/NotificationComponents";
import toast from "react-hot-toast";

// Show custom success notification
toast.custom((t) => (
  <SuccessNotification
    message="Your custom message"
    onClose={() => toast.dismiss(t.id)}
    autoClose={4000}
  />
));
```

## Real-World Examples

### Cart Operations
```tsx
function addToCart(product) {
  try {
    cart.add(product);
    toast.success(`Added ${product.name} to cart`);
  } catch (error) {
    toast.error("Failed to add to cart");
  }
}
```

### Form Submission
```tsx
async function handleSubmit(formData) {
  const id = toast.loading("Saving your changes...");
  
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    
    if (response.ok) {
      toast.dismiss(id);
      toast.success("Changes saved!");
    } else {
      throw new Error("Save failed");
    }
  } catch (error) {
    toast.dismiss(id);
    toast.error("Failed to save changes");
  }
}
```

### Order Creation
```tsx
async function createOrder(items) {
  const id = toast.loading("Creating your order...");
  
  try {
    const res = await fetch("/api/create-order", {
      method: "POST",
      body: JSON.stringify(items),
    });
    
    const data = await res.json();
    
    if (data.orderId) {
      toast.dismiss(id);
      toast.success("Order created! Redirecting to payment...");
      router.push(`/checkout/payment/${data.orderId}`);
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    toast.dismiss(id);
    toast.error(error.message || "Failed to create order");
  }
}
```

## Notification Types

### Success Notifications
```tsx
// With automatic completion animation
toast.success("Item added to cart!");
toast.success("Payment processed successfully!");
toast.success("Profile updated!");
```

**Style**: Green gradient background with checkmark icon
**Duration**: 4 seconds
**Icon Animation**: Animated checkmark appearing

### Error Notifications
```tsx
// With error shake animation
toast.error("Failed to process payment");
toast.error("Invalid email address");
toast.error("Something went wrong. Please try again.");
```

**Style**: Red gradient background with alert icon
**Duration**: 5 seconds
**Icon Animation**: Rotating shake animation

### Loading Notifications
```tsx
// Spinner continues until dismissed
const id = toast.loading("Uploading file...");
const id = toast.loading("Processing payment...");

// Then dismiss when done
toast.dismiss(id);
```

**Style**: Blue gradient background with spinning loader
**Duration**: Until manually dismissed
**Icon Animation**: Continuous rotating spinner

### Info Notifications
```tsx
// For informational messages
toast.custom((t) => (
  <InfoNotification
    message="Check your email for confirmation"
    onClose={() => toast.dismiss(t.id)}
  />
));
```

**Style**: Blue gradient background with info icon
**Duration**: 4 seconds
**Icon Animation**: Gentle floating animation

## Customization

### Change Position
```tsx
// In providers.tsx, modify the CustomToaster component
<CustomToaster position="top-right" />

// Available positions:
// "top-left", "top-center", "top-right"
// "bottom-left", "bottom-center", "bottom-right"
```

### Modify Durations
Edit the `toastOptions` in [src/components/CustomToaster.tsx](src/components/CustomToaster.tsx):

```tsx
toastOptions={{
  success: {
    duration: 3000,  // Changed from 4000
  },
  error: {
    duration: 6000,  // Changed from 5000
  },
}}
```

### Update Colors
Edit the gradient colors in [src/components/CustomToaster.tsx](src/components/CustomToaster.tsx) and [src/components/NotificationComponents.tsx](src/components/NotificationComponents.tsx):

```tsx
case "success":
  return "from-green-950/40 to-emerald-950/40 border-green-500/30";
  // Modify these color classes
```

## CSS Animations

The following animations are defined in [src/app/globals.css](src/app/globals.css):

- `toastSlideIn`: Slide up + scale entrance
- `toastSlideOut`: Slide down + scale exit
- `toastPulse`: Pulsing glow effect
- `toastGlow`: Soft glow animation
- `toast-success`: Success shimmer
- `toast-error`: Error shimmer
- `toast-loading`: Continuous spin

## Best Practices

1. **Always dismiss loading toasts**
   ```tsx
   const id = toast.loading("Processing...");
   // Do work...
   toast.dismiss(id);
   ```

2. **Use appropriate notification types**
   - Success: When actions complete
   - Error: When something fails
   - Loading: For ongoing operations
   - Info: For helpful messages

3. **Keep messages concise**
   ```tsx
   // Good
   toast.success("Item added");
   
   // Avoid
   toast.success("Your item has been successfully added to the shopping cart");
   ```

4. **Handle errors gracefully**
   ```tsx
   try {
     await someAction();
     toast.success("Done!");
   } catch (error) {
     toast.error(error.message || "An error occurred");
   }
   ```

5. **Use loading for async operations**
   ```tsx
   const id = toast.loading("Loading...");
   const data = await fetchData();
   toast.dismiss(id);
   toast.success("Loaded!");
   ```

## File Structure

```
src/
├── components/
│   ├── CustomToaster.tsx           # Main toaster component
│   ├── NotificationComponents.tsx  # Notification variants
│   └── ...
├── lib/
│   ├── toast-utils.ts             # Utility hook and functions
│   └── ...
├── app/
│   ├── providers.tsx              # CustomToaster setup
│   ├── globals.css               # Toast animations
│   └── ...
└── ...
```

## Browser Support

Works on all modern browsers:
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- Animations use GPU acceleration (transform, opacity)
- Backdrop blur is optimized for performance
- Multiple toasts stack efficiently
- Automatic cleanup on dismiss

## Troubleshooting

**Toasts not appearing?**
- Ensure `CustomToaster` is in your providers
- Check browser console for errors
- Verify CSS animations are not disabled

**Animations not smooth?**
- Disable browser extensions
- Check hardware acceleration settings
- Use `backdrop-filter: auto` in browser settings

**Colors not showing?**
- Clear browser cache
- Rebuild with `npm run build`
- Check Tailwind CSS configuration

---

**Created**: April 2, 2026
**Last Updated**: Current Session
