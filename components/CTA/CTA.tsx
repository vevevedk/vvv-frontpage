import React, {
  ReactElement,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import styles from "../../components/CTA/CTA.module.css";

interface CTA {
  stil: stil;
  tekst: tekst;
  popup: ReactElement;
}

export enum stil {
  blue = "blue",
  orange = "orange",
  white = "white",
}

export enum tekst {
  kontakt = "kontakt",
}

const CTAButton: React.FC<CTA> = ({ stil, tekst, popup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<any>(null);
  const modalRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !buttonRef?.current?.contains(event.target as Node) &&
        !modalRef?.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [buttonRef, modalRef]);

  const preventScrolling = useCallback(
    (event: TouchEvent) => {
      if (isOpen) {
        event.preventDefault();
      }
    },
    [isOpen]
  );

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.addEventListener("touchmove", preventScrolling, {
        passive: false,
      });
    } else {
      document.documentElement.style.overflow = "auto";
      document.body.removeEventListener("touchmove", preventScrolling);
    }
    return () => {
      document.documentElement.style.overflow = "auto";
      document.body.removeEventListener("touchmove", preventScrolling);
    };
  }, [isOpen, preventScrolling]);

  function ShowModal() {
    if (isOpen) {
      return (
        <div className={`${styles.ModalBody}`} ref={modalRef}>
          <div className={styles.ModalContent}>{popup}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      {ShowModal()}
      <button
        className={styles[stil]}
        onClick={() => setIsOpen(!isOpen)}
        ref={buttonRef}
      >
        <h3>{tekst}</h3>
      </button>
    </div>
  );
};
export default CTAButton;
