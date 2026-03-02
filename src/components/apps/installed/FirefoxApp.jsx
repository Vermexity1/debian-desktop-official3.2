// Firefox uses the same WebBrowser component but with Firefox branding
import WebBrowser from "@/components/apps/WebBrowser";
export default function FirefoxApp(props) {
  return <WebBrowser {...props} browserName="Firefox" />;
}
