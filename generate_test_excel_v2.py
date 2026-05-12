import pandas as pd

data = [
    ["Vorname", "Nachname", "Klasse", "Wunsch 1", "Wunsch 2", "Wunsch 3", "Anti-Wunsch"],
    ["Max", "Mustermann", "10a", "1", "2", "3", "10"],
    ["Erika", "Musterfrau", "EF", "2", "3", "4", "11"],
    ["Hans", "Schmidt", "6b", "1", "4", "5", "42"],
    ["Lina", "Meyer", "Q1", "10", "11", "12", "1"],
]

df = pd.DataFrame(data[1:], columns=data[0])
df.to_excel("test_data_v2.xlsx", index=False)
