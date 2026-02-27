from pathlib import Path
import argparse
import sys
import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image

IMAGE_SIZE = (160, 48)
BLANK_TOKEN = 0

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available()
    else "cpu"
)


class HTRModel(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Dropout2d(0.1),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Dropout2d(0.1),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Dropout2d(0.15),
            nn.MaxPool2d((2, 1), (2, 1)),
        )
        rnn_input_size = 128 * (IMAGE_SIZE[1] // 8)
        self.lstm1 = nn.LSTM(rnn_input_size, 256, bidirectional=True, batch_first=True)
        self.lstm2 = nn.LSTM(512, 128, bidirectional=True, batch_first=True)
        self.lstm_dropout = nn.Dropout(0.2)
        self.head_dropout = nn.Dropout(0.2)
        self.classifier = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.features(x)
        b, c, h, w = x.size()
        x = x.permute(0, 3, 1, 2).contiguous()
        x = x.view(b, w, c * h)
        x, _ = self.lstm1(x)
        x = self.lstm_dropout(x)
        x, _ = self.lstm2(x)
        x = self.lstm_dropout(x)
        x = self.head_dropout(x)
        x = self.classifier(x)
        return x.log_softmax(2)


def build_val_transform(image_size_wh):
    w, h = image_size_wh
    return T.Compose([
        T.Grayscale(num_output_channels=1),
        T.Resize((h, w)),
        T.ToTensor(),
        T.Normalize([0.5], [0.5]),
    ])


def greedy_decode(log_probs, input_lengths, idx_to_char, blank=BLANK_TOKEN):
    max_probs = log_probs.detach().cpu().argmax(2)
    decoded = []
    for seq, seq_len in zip(max_probs, input_lengths):
        prev = None
        chars = []
        for idx in seq[:seq_len]:
            idx = idx.item()
            if idx == blank:
                prev = None
                continue
            if idx != prev:
                chars.append(idx_to_char.get(idx, ""))
            prev = idx
        decoded.append("".join(chars))
    return decoded


def load_model(device):
    base_dir = Path(__file__).resolve().parent
    best_path = base_dir / "htr_model_best.pt"
    latest_path = base_dir / "htr_model_latest.pt"
    model_path = best_path if best_path.exists() else latest_path

    if not model_path.exists():
        raise FileNotFoundError(f"Checkpoint not found at {best_path} or {latest_path}")

    checkpoint = torch.load(model_path, map_location=device)
    model = HTRModel(num_classes=checkpoint["num_classes"]).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model, checkpoint


def predict(image_path):
    model, checkpoint = load_model(DEVICE)
    transform = build_val_transform(IMAGE_SIZE)
    idx_to_char = checkpoint["idx_to_char"]

    img = Image.open(image_path)
    img_tensor = transform(img)
    img_batch = img_tensor.unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        log_probs = model(img_batch)
        t_steps = log_probs.size(1)
        input_lengths = torch.tensor([t_steps], dtype=torch.long, device=DEVICE)
        prediction = greedy_decode(log_probs, input_lengths, idx_to_char)[0]

    return prediction


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image_path", type=str)
    args = parser.parse_args()

    try:
        prediction = predict(args.image_path)
        print(prediction)
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
