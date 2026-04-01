import sys
import json
import datetime

def generate_report(format, logs):
    # 간단한 리포트 생성 로직
    summary = "\n".join(logs[-5:])
    report = f"--- {format.upper()} Report ---\n{summary}\nGenerated at: {datetime.datetime.now()}"
    return report

if __name__ == "__main__":
    format = sys.argv[1]
    logs = json.loads(sys.argv[2])
    print(generate_report(format, logs))
