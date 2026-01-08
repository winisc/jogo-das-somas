import Modal from "./Modal";

export default function HelpModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Como jogar">
      <p className="text-sm text-[#539fa2] leading-relaxed">
        Resolva as somas corretamente para avançar no jogo. Quanto mais rápido
        você responder, maior será sua pontuação.
      </p>
    </Modal>
  );
}
