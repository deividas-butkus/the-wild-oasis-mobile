import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

type SymbolName = ComponentProps<typeof SymbolView>["name"];

// SF Symbols on iOS, Material Symbols on Android and web
const icons = {
  cabins: { ios: "house", android: "cottage", web: "cottage" },
  reservations: { ios: "calendar", android: "event", web: "event" },
  account: { ios: "person.crop.circle", android: "account_circle", web: "account_circle" },
  guests: { ios: "person.2.fill", android: "group", web: "group" },
  location: { ios: "mappin.and.ellipse", android: "location_on", web: "location_on" },
  privacy: { ios: "eye.slash.fill", android: "visibility_off", web: "visibility_off" },
  about: { ios: "info.circle", android: "info", web: "info" },
  menu: { ios: "line.3.horizontal", android: "menu", web: "menu" },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof icons;

type Props = { name: IconName; color: ColorValue; size?: number };

export function Icon({ name, color, size = 20 }: Props) {
  return <SymbolView name={icons[name]} tintColor={color} size={size} />;
}
