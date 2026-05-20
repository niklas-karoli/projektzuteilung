import pandas as pd

# Original data
data = [
    ["Vorname", "Nachname", "Klasse", "Wunsch 1", "Wunsch 2", "Wunsch 3", "Anti-Wunsch"],
    ["Max", "Mustermann", "10a", "1", "2", "3", "10"],
    ["Erika", "Musterfrau", "EF", "2", "3", "4", "11"],
]
df = pd.DataFrame(data[1:], columns=data[0])
df.to_excel("initial_data.xlsx", index=False)

# Late vote data
# Max changes his wishes, and a new student Hans is added
late_data = [
    ["Vorname", "Nachname", "Klasse", "Wunsch 1", "Wunsch 2", "Wunsch 3", "Anti-Wunsch"],
    ["Max", "Mustermann", "10a", "5", "6", "7", "1"],
    ["Hans", "Schmidt", "6b", "1", "2", "3", "42"],
]
df_late = pd.DataFrame(late_data[1:], columns=late_data[0])
df_late.to_excel("late_data.xlsx", index=False)
