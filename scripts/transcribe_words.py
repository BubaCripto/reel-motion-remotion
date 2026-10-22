"""Offline word-aligned subtitles with faster-whisper; requires pip install faster-whisper.
Usage: python scripts/transcribe_words.py input.mp4 small output.json
First run downloads model weights. The video/audio file remains local.
"""
import json
import sys
import uuid


def main():
    if len(sys.argv) < 4:
        raise ValueError('Uso: transcribe_words.py INPUT MODEL OUT')
    from faster_whisper import WhisperModel
    source, model_name, dest = sys.argv[1:4]
    model = WhisperModel(model_name, device='auto', compute_type='int8')
    segments, _info = model.transcribe(source, language='pt', word_timestamps=True, vad_filter=True)
    cues = []
    current = []

    def flush():
        if not current:
            return
        start = float(current[0]['start'])
        end = float(current[-1]['end'])
        words = []
        for w in current:
            word = w['text']
            words.append({'id': str(uuid.uuid4()), 'text': word, 'highlight': False,
                          'start': float(w['start']), 'end': float(w['end'])})
        cues.append({'id': str(uuid.uuid4()), 'start': start, 'end': end,
                     'text': ' '.join(w['text'] for w in current),
                     'source': 'transcript', 'track': 1, 'x': 50, 'y': 55, 'words': words})
        current.clear()

    for segment in segments:
        for w in segment.words or []:
            token = str(w.word).strip()
            if not token or w.start is None or w.end is None:
                continue
            if current and (float(w.end) - float(current[0]['start']) > 2.8 or len(current) >= 8):
                flush()
            current.append({'text': token, 'start': w.start, 'end': w.end})
            if token.endswith(('.', '!', '?')) and len(current) >= 3:
                flush()
    flush()
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump({'cues': cues}, f, ensure_ascii=False)
    print(f'{len(cues)} legendas sincronizadas por palavra')


if __name__ == '__main__':
    main()
