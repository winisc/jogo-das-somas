import Modal from "./Modal";

export default function ConfigModal({
  isOpen,
  onClose,
  onReset,
  audioEnabled,
  setAudioEnabled,
  onPlayAgain,
  gameStarted,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      extraButtons={true}
      title="Configurações"
      onReset={onReset}
      onPlayAgain={onPlayAgain}
      gameStarted={gameStarted}
    >
      <div className="space-y-4 text-sm text-[#539fa2]">
        <div className="flex items-center justify-between">
          <span>Som</span>
          <input
            type="checkbox"
            className="accent-[#539fa2] cursor-pointer"
            checked={!!audioEnabled}
            onChange={() => setAudioEnabled && setAudioEnabled((v) => !v)}
          />
        </div>

        {/* <div className="flex items-center justify-between">
          <span>Dificuldade</span>
          <select className="rounded-lg px-2 py-1 bg-[#c4dbb4] cursor-pointer">
            <option>Fácil</option>
            <option>Médio</option>
            <option>Difícil</option>
          </select>
        </div> */}
      </div>
    </Modal>
  );
}
