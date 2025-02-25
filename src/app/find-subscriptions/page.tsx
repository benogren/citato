import Header from "@/components/header";
import FindSubscriptions from "./FindSubscriptions";

export const metadata = {
  title: 'citato.ai | Find Subscriptions',
};

export default function SubscriptionsPage() {
  return (
    <>
    <Header/>
    <FindSubscriptions />
    </>
  );
}