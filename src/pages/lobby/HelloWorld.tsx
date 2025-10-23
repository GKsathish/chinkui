import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HelloWorld() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "BACK_TO_HOME") {
        console.log("Back button clicked in iframe, navigating parent...");
        navigate(-1); // Navigate back in parent
      }
    };

    // Listen for messages from the iframe
    window.addEventListener("message", handleMessage);

    return () => {
      // Cleanup the event listener when component unmounts
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  return (
    <iframe
      src="https://stage.bougeegames.com/slot-games/buffalo-safari?token=f11e23b2-150e-4a73-8021-10cf327515f7&operatorId=opfiesta&userName=raja%20manohar&partnerId=INR&providerId=AISLOT&lobby=false&gameId=SGBS101&opentable=STGBS101&userType=BOT&conversionrate=100.00&theme=DARK"
      width="100%"
      height="100%"
      className="border rounded-lg shadow-lg"
      title="Embedded Page"
      style={{
        pointerEvents: "auto",
        backgroundColor: "transparent",
        position: "relative",
      }}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation allow-top-navigation-by-user-activation"
    />
  );
}
