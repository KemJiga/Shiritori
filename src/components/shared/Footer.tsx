export function Footer() {
  return (
    <footer className="py-3 px-6 text-center text-[11px] text-gray-700">
      <div className="inline-flex flex-wrap justify-center gap-x-3 gap-y-0.5">
        <span>
          Made by{' '}
          <a href="https://github.com/KemJiga" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 transition-colors">
            KemJiga
          </a>
        </span>
        <span className="text-gray-800">&middot;</span>
        <span>
          Word lists by{' '}
          <a href="https://github.com/words" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 transition-colors">
            words
          </a>
        </span>
      </div>
    </footer>
  );
}
