import {
  ArrowLeft, ArrowRight, Book, BookOpen, Briefcase, CalendarDays, Check, ChevronLeft, ChevronRight, CircleCheck, CircleDot,
  ClipboardCheck, Clock, CloudSun, Compass, Download, Feather, Flag, Flame, Footprints, GlassWater, GraduationCap, GripVertical,
  HeartPulse, Languages, Minus, Moon, MoonStar, MousePointerClick, Palette, Phone, Plus, Quote, Receipt, Repeat, RotateCcw,
  Settings, Smartphone, Sparkles, Sun, SunMedium, Sunrise, Sunset, Target, Trash2, Users, Wallet, Wind, X, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  "arrow-left": ArrowLeft, "arrow-right": ArrowRight, book: Book, "book-open": BookOpen, briefcase: Briefcase,
  "calendar-days": CalendarDays, check: Check, "chevron-left": ChevronLeft, "chevron-right": ChevronRight,
  "circle-check": CircleCheck, "circle-dot": CircleDot, "clipboard-check": ClipboardCheck, clock: Clock, "cloud-sun": CloudSun,
  compass: Compass, download: Download, feather: Feather, flag: Flag, flame: Flame, footprints: Footprints,
  "glass-water": GlassWater, "graduation-cap": GraduationCap, "grip-vertical": GripVertical, "heart-pulse": HeartPulse,
  languages: Languages, minus: Minus, moon: Moon, "moon-star": MoonStar, "mouse-pointer-click": MousePointerClick,
  palette: Palette, phone: Phone, plus: Plus, quote: Quote, receipt: Receipt, repeat: Repeat, "rotate-ccw": RotateCcw,
  settings: Settings, smartphone: Smartphone, sparkles: Sparkles, sun: Sun, "sun-medium": SunMedium, sunrise: Sunrise,
  sunset: Sunset, target: Target, trash: Trash2, users: Users, wallet: Wallet, wind: Wind, x: X,
};

export const ICON_CHOICES = ["circle-dot", "sunrise", "book-open", "sun", "target", "glass-water", "footprints", "book", "phone", "feather", "wind", "receipt", "smartphone", "heart-pulse", "sparkles"];

export function Icon({ name }: { name: string }) {
  const C = MAP[name] ?? CircleDot;
  return <C aria-hidden="true" />;
}
