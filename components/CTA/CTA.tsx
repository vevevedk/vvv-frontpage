import React, {
  ReactElement,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import styles from "../../components/CTA/CTA.module.css";

interface CTAProps {
  stil: Stil;
  tekst: Tekst;
  popup: ReactElement;
}

export enum Stil {
  blue = "blue",
  orange = "orange",
  white = "white",
}

export enum Tekst {
  kontakt = "kontakt",
}

const CTAButton: React.FC<CTAProps> = ({ stil, tekst, popup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        modalRef.current && !modalRef.current.contains(event.target as Node)
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
  }, [isOpen, preventScrolling]);

  const ShowModal = () => {
    if (isOpen) {
      return (
        <div className={styles.ModalBody} ref={modalRef}>
          <div className={styles.ModalContent}>{popup}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.cta_section}>
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
