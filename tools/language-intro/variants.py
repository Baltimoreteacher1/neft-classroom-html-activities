from pathlib import Path
base=Path(__file__).with_name('Intro.tsx').read_text()
variants={
 'Teacher':{
 'EVERY IDEA STARTS SOMEWHERE':'WELCOME, EDUCATORS', 'Find your words.':'See the learning.', 'Make them yours.':'Try it yourself.', 'A place to practice English, one step at a time.':'A guided tour of The Language Page for teachers.',
 'FOUR WAYS TO GROW':'START WITH YOUR STUDENTS', 'One idea.':'Pick a skill.', 'Many ways in.':'Choose a grade.',
 'BUILD LANGUAGE WITH SUPPORT':'TRY IT AS A STUDENT', 'Start small.':'See the task.', 'Say more.':'Explore support.', 'Use words, pictures, and sentence frames to put ideas into action.':'Experience an activity and the language supports alongside it.',
 'MADE FOR EXPLORING':'EXPLORE THE PRACTICE', 'Choose a skill.':'See what', 'Keep moving.':'learners see.', 'Find practice, activities, and tools in one welcoming place.':'Open real practice in listening, speaking, reading, and writing.',
 'GROW ONE STEP AT A TIME':'BRING IT TO YOUR CLASS', 'From a word':'Choose support', 'to a ':'for your ', 'whole idea.':'class.',
 'Birds fly.':'Pick a skill', 'Small white birds fly.':'Try an activity', 'Small white birds fly over the lake.':'Use it with your class',
 'Your words can':'See the tools.', 'take you anywhere.':'Start the tour.', 'thelanguagepage.com ↗':'Teacher Tour ↗'},
 'Family':{
 'EVERY IDEA STARTS SOMEWHERE':'WELCOME, FAMILIES', 'Find your words.':'Explore together.', 'Make them yours.':'Grow together.', 'A place to practice English, one step at a time.':'A guided family tour of The Language Page.',
 'FOUR WAYS TO GROW':'FOUR WAYS TO PRACTICE', 'One idea.':'A little practice.', 'Many ways in.':'Lots to explore.',
 'BUILD LANGUAGE WITH SUPPORT':'TRY SOMETHING TOGETHER', 'Start small.':'Find a word.', 'Say more.':'Share an idea.', 'Use words, pictures, and sentence frames to put ideas into action.':'Explore words, pictures, and helpful sentence frames together.',
 'MADE FOR EXPLORING':'REAL PLACES, REAL PRACTICE', 'Choose a skill.':'Pick a stop.', 'Keep moving.':'Try it together.', 'Find practice, activities, and tools in one welcoming place.':'Visit real parts of the site with a guide beside you.',
 'GROW ONE STEP AT A TIME':'YOUR FAMILY EXPEDITION', 'From a word':'Choose a stop.', 'to a ':'Explore ', 'whole idea.':'together.',
 'Birds fly.':'Pick a stop', 'Small white birds fly.':'See it for real', 'Small white birds fly over the lake.':'Check it off and keep exploring',
 'Your words can':'Learn together.', 'take you anywhere.':'Start your tour.', 'thelanguagepage.com ↗':'Family Expedition ↗'} }
for name,mapping in variants.items():
 text=base
 for old,new in mapping.items(): text=text.replace(old,new)
 Path(__file__).with_name(name+'.tsx').write_text(text)
