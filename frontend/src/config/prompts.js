// frontend/src/config/prompts.js
// Dedicated Prompt Repository for Columns A to CF, mapping all SEPiCP variables, student (_s), and instructor (_p) keys with strict dynamic validation.

export const COLUMN_PROMPTS = {
  // Column A
  "column_a": {
    column: "A",
    question: "Start Date",
    keys: ["start_date", "startdate"],
    prompts: []
  },

  // Column B
  "column_b": {
    column: "B",
    question: "Progress",
    keys: ["progress"],
    prompts: []
  },

  // Column C
  "column_c": {
    column: "C",
    question: "Your name",
    keys: ["your_name", "student_name", "instructor_name", "q1", "q1_name"],
    prompts: []
  },

  // Column D
  "column_d": {
    column: "D",
    question: "Please enter the name of your University or Institution.",
    keys: ["university", "q2", "q2_university"],
    prompts: []
  },

  // Column E
  "column_e": {
    column: "E",
    question: "Your academic email id.",
    keys: ["email", "q108", "q108_email"],
    prompts: []
  },

  // Column F
  "column_f": {
    column: "F",
    question: "Please mention the city, state and country where you teach/study.",
    keys: ["location", "q109", "q109_location"],
    prompts: []
  },

  // Column G
  "column_g": {
    column: "G",
    question: "Semester for which you are filling out this survey? - Selected Choice",
    keys: ["semester", "q3", "q3_semester"],
    prompts: [
      "The course is being evaluated for an earlier academic period, meaning the responses represent student experiences and teaching practices associated with that specific semester. Based on the academic corpus, what are key methods to analyze historical course data to identify persistent learning barriers?",
      "The survey represents a current or ongoing academic period, providing a contemporary view of how the course is being delivered and experienced by students. Based on the academic corpus, how can instructors gather and respond to mid-term student feedback to optimize course delivery in real time?",
      "The survey relates to a future or upcoming academic period, so the information may primarily represent planned or anticipated course delivery rather than completed classroom experiences. Based on the academic corpus, what proactive course design strategies should be implemented during the planning phase to ensure a successful syllabus?"
    ]
  },

  // Column H
  "column_h": {
    column: "H",
    question: "Semester for which you are filling out this survey?",
    keys: ["q3_semester_text", "q3_4_text"],
    prompts: []
  },

  // Column I
  "column_i": {
    column: "I",
    question: "Number and full title of the course you are reviewing here.",
    keys: ["course", "q4", "q4_course"],
    prompts: []
  },

  // Column J
  "column_j": {
    column: "J",
    question: "Is this an undergraduate (bachelors) or Graduate (Masters) degree class?",
    keys: ["degree_level", "q111", "q111_degree_level"],
    prompts: [
      "(Undergraduate/Bachelors): The course is taught at the undergraduate level, where students may benefit from greater foundational explanation, structured guidance, practical examples, and activities that progressively build conceptual understanding. Based on educational research, what are the most effective active learning strategies for building foundational skills in undergraduate students?",
      "(Graduate/Masters): The course is taught at the graduate level, where students are generally expected to engage with more advanced concepts, independent analysis, research-oriented discussion, and complex problem-solving. Based on educational research, how can instructors structure seminar discussions and independent research projects to foster critical analysis at the graduate level?",
      "(Mixed/Other): The course does not fit neatly into a single undergraduate or graduate category, suggesting that the teaching approach may need to accommodate students with different levels of academic preparation and experience. Based on educational research, how can differentiated instruction be applied to teach advanced topics to a mixed cohort?"
    ]
  },

  // Column K
  "column_k": {
    column: "K",
    question: "Please tell us approximately how many students are in this class.",
    keys: ["student_count", "q104", "q104_student_count"],
    prompts: [
      "(1–30 students): The class has a relatively small number of students, making it easier for the professor to provide individualized attention, conduct detailed discussions, monitor participation, and incorporate interactive activities. Based on research, what are the best practices for leveraging small class sizes to maximize student-centered learning?",
      "(31–50 students): The class has a moderate number of students, providing opportunities for interaction and group activities while still requiring the professor to deliberately structure participation and classroom management. Based on research, how can an instructor design scalable group work and structured discussions for medium-sized classes?",
      "(51+ students): The class has a relatively large number of students, which can make individualized interaction and full-class participation more challenging and may require structured group activities, technology-assisted engagement, and carefully managed discussions. Based on research, what strategies can maintain high engagement and personal connection in large lecture halls?"
    ]
  },

  // Column L
  "column_l": {
    column: "L",
    question: "What is the format of your class?",
    keys: ["class_format", "q105", "q105_class_format"],
    prompts: [
      "(Face-to-Face): The course is conducted primarily in a physical classroom, allowing direct interaction between the professor and students through in-person discussions, demonstrations, activities, and hands-on learning. Based on academic literature, what are the key benefits of face-to-face active learning and how can they be maximized?",
      "(Hybrid): The course combines face-to-face and online instruction, requiring the professor to effectively coordinate both physical and virtual learning environments while maintaining consistent student engagement across both formats. Based on academic literature, how can instructors design a cohesive hybrid model that bridges synchronous and asynchronous components?",
      "(Online): The course is delivered primarily online, requiring the professor to rely on digital communication, virtual discussions, online activities, and technology-supported methods to maintain interaction and student participation. Based on academic literature, what are the best virtual engagement strategies to build community in fully online courses?"
    ]
  },

  // Column M
  "column_m": {
    column: "M",
    question: "What percentage of your online class is synchronous, where you meet/work with the students live online?",
    keys: ["online_pct", "q107_1", "q107_1_online_pct"],
    prompts: [
      "(0–33%): Only a small portion of the online course involves live interaction with students. Most learning occurs asynchronously through recorded lectures, readings, assignments, discussion boards, or other independent activities. Based on research, how can asynchronous courses be structured with clear checkpoints to prevent student disengagement?",
      "(34–66%): A substantial portion of the online course involves live meetings, providing regular opportunities for real-time discussion, questioning, clarification, and interaction while still significant learning activities remain for asynchronous work. Based on research, what is the optimal mix of synchronous interaction and asynchronous reflection in online higher education?",
      "(67–100%): Most of the online course is conducted through live sessions, creating frequent opportunities for real-time interaction, discussion, instructor feedback, collaborative activities, and immediate clarification of concepts. Based on research, how can instructors structure intensive synchronous online sessions to maintain high energy and prevent Zoom fatigue?"
    ]
  },

  // Column N
  "column_n": {
    column: "N",
    question: "Your role in this class? - Selected Choice",
    keys: ["role", "q6", "q_role", "q1_role", "user_role", "selected_choice"],
    prompts: [
      "Provide 2 basic, high-level tips for the teacher to engage a student with the profile of [Selected Choice].",
      "Analyze how [Selected Choice] impacts classroom expectations to generate 3 actionable strategies for targeted communication and support.",
      "Evaluate the deep pedagogical needs of this [Selected Choice] role, diagnosing friction points for a differentiated coaching plan."
    ]
  },

  // Column O
  "column_o": {
    column: "O",
    question: "Your role in this class? - Student. Please enter the name of your professor here - Text",
    keys: ["teacher_name", "professor_name", "q6_2_text", "total_engage_score_p", "q_prof_name", "q105_prof"],
    prompts: []
  },

  // Column P
  "column_p": {
    column: "P",
    question: "Engagement rating / extent classroom keeps students engaged",
    keys: ["total_engage", "engage_score", "overall_engagement", "total_engage_score_s", "engage_s", "engage_p"],
    prompts: [
      "We just sit and listen to monotonous lectures without any interactive elements to keep our attention. Based on academic literature, what structured strategies and interactive elements can an instructor introduce to transform passive lecture listening into active cognitive engagement?",
      "The group activities are somewhat engaging, but the long theoretical sections drag on and make me lose focus. Based on the academic corpus, how can theoretical lecture sections be streamlined or punctuated with active learning triggers to maintain high student focus?",
      "The constant use of real-world examples and active discussions keep the whole class completely absorbed! Based on research, how can teachers sustain and scale this high-engagement environment across all course modules?"
    ]
  },

  // Column Q
  "column_q": {
    column: "Q",
    question: "Indicate the number of times your professor uses real world examples to teach",
    keys: ["content_1", "content_s_1", "content_p_1", "real_world_examples"],
    prompts: [
      "(Rarely): They almost never use real-world examples, sticking only to textbook theory, which makes the concepts hard to apply. What introductory steps and simple real-world application examples can the instructor integrate into theoretical lectures based on published pedagogical research?",
      "(Sometimes): Real-world examples are used occasionally, which is somewhat helpful but needs to be done more consistently. How can the instructor systematically embed real-world examples into every lesson unit based on the corpus?",
      "(Frequently): They constantly integrate real-world examples into every lesson, making complex topics incredibly easy to grasp and apply! How can an instructor scale student-generated real-world case studies to deepen mastery according to literature?"
    ]
  },

  // Column R
  "column_r": {
    column: "R",
    question: "Indicate the number of times your professor uses personal experiences relevant to the topic",
    keys: ["content_2", "content_s_2", "content_p_2", "personal_experiences"],
    prompts: [
      "(Rarely): The professor almost never shares personal experiences, making the material feel dry and detached from actual reality. How can an instructor start weaving authentic professional or personal experiences into lecture topics based on academic guidelines?",
      "(Sometimes): Occasionally, they share a relevant personal story, which helps clarify the topic but doesn't happen quite often enough. How can an instructor optimize personal story sharing to directly reinforce key learning objectives according to research?",
      "(Frequently): They regularly weave in highly relevant personal experiences, bringing the theory to life and making the learning truly memorable. What strategies exist in published papers to encourage peer personal story sharing while maintaining high academic standards?"
    ]
  },

  // Column S
  "column_s": {
    column: "S",
    question: "Indicate the number of times your professor uses material directly applicable outside class",
    keys: ["content_3", "content_s_3", "content_p_3", "material_applicable"],
    prompts: [
      "(Rarely): The material is mostly theoretical and textbook-focused, so I rarely see how to apply these concepts in my future career. What basic steps recommend papers to link theoretical course content with industry tasks and career utility?",
      "(Sometimes): There are occasional connections to the outside world, but a significant portion of the class remains strictly academic. How can an instructor refine theoretical assignments into industry-applicable tasks based on research?",
      "(Frequently): The professor constantly ties every lesson directly to industry practices, making everything we learn immediately useful! How can instructors scale career relevance by partnering with industry experts or live workplace challenges?"
    ]
  },

  // Column T
  "column_t": {
    column: "T",
    question: "Indicate the number of times your professor uses current news or updated topics",
    keys: ["content_4", "content_s_4", "content_p_4", "current_news", "updated_topics"],
    prompts: [
      "(Rarely): The course material feels severely outdated because the professor almost never references current news or recent advancements in the field. How can an instructor easily introduce 5-minute weekly current event breakdowns to modernize course content?",
      "(Sometimes): We occasionally touch on current events, but it feels like an afterthought rather than a core part of the weekly lessons. How can instructors integrate current news directly into core assessment criteria based on educational research?",
      "(Frequently): Every single class session starts with an analysis of current news or newly updated research, making the subject feel incredibly modern and alive. How can instructors sustain this current-news integration efficiently across changing semesters?"
    ]
  },

  // Column U
  "column_u": {
    column: "U",
    question: "Indicate the number of times your professor uses real case studies",
    keys: ["content_5", "content_s_5", "content_p_5", "real_case_studies"],
    prompts: [
      "(Rarely): The professor almost never utilizes real case studies, making it difficult to understand how these theories apply in actual practice. What beginner strategies do papers suggest to introduce short, real-world case studies into traditional lectures?",
      "(Sometimes): We analyze a case study once in a while, which helps, but we need more regular analysis to truly grasp the concepts. How can instructors structure regular mini case-study discussions to build consistent problem-solving skills?",
      "(Frequently): They constantly present detailed, real-world case studies, allowing us to deeply explore actual scenarios and develop practical problem-solving skills. How can instructors facilitate multi-stage case study projects that mirror professional decision-making?"
    ]
  },

  // Column V
  "column_v": {
    column: "V",
    question: "Indicate the number of times your professor uses hypothetical case studies",
    keys: ["content_6", "content_s_6", "content_p_6", "hypothetical_case_studies"],
    prompts: [
      "(Rarely): The professor almost never uses hypothetical case studies, so we rarely get the chance to practice our problem-solving skills in controlled, 'what-if' scenarios. How can teachers create simple hypothetical scenarios to test student understanding during lectures?",
      "(Sometimes): We occasionally work through hypothetical case studies, which is somewhat helpful for testing theories, but they aren't a regular part of the lectures. How can instructors optimize hypothetical case studies to challenge critical thinking consistently?",
      "(Frequently): They frequently introduce complex hypothetical case studies, which constantly challenges us to think critically and apply our knowledge to entirely new and creative situations! How can teachers guide advanced hypothetical simulations to foster innovative student solutions?"
    ]
  },

  // Column W
  "column_w": {
    column: "W",
    question: "Your professor allows students to share how they relate to content",
    keys: ["relevance_1", "relevance_1s", "relevance_1p", "share_relate", "student_perspective"],
    prompts: [
      "(Rarely): The professor almost never lets us share our perspectives, making the lectures feel completely one-sided and disconnected. What introductory prompt techniques can teachers use to invite student personal connections during class?",
      "(Sometimes): We occasionally get to share how we relate to the topics, but usually only if there happens to be extra time at the end. How can instructors build dedicated 3-minute sharing prompts directly into lesson plans?",
      "(Frequently): The professor consistently encourages us to share our personal connections to the material, making the class highly collaborative! How can teachers synthesize student personal insights to enrich overall curriculum delivery?"
    ]
  },

  // Column X
  "column_x": {
    column: "X",
    question: "Professor persuades students to connect material to real life",
    keys: ["relevance_2", "relevance_2s", "relevance_2p", "connect_real_life", "persuades_connect"],
    prompts: [
      "(Rarely): The professor focuses strictly on the textbook and almost never encourages us to see how the material applies to our actual lives. How can an instructor design reflective exit tickets asking students to relate topics to daily life?",
      "(Sometimes): Every now and then they try to help us connect the topics to our own lives, but it is not a consistent focus of the course. What strategies can instructors use to consistently link abstract concepts to everyday student experiences?",
      "(Frequently): They are constantly challenging us to find examples from our daily routines, making the concepts highly relatable and deeply engaging! How can instructors scale daily-life connection exercises into creative student project portfolios?"
    ]
  },

  // Column Y
  "column_y": {
    column: "Y",
    question: "Professor keeps content entertaining",
    keys: ["relevance_3", "relevance_3s", "relevance_3p", "content_entertaining", "prof_entertaining"],
    prompts: [
      "(Rarely): The lectures are completely dry and boring, making it almost impossible to stay focused or interested in the content. What dynamic presentation techniques, humor, or media elements do papers recommend to increase lecture enthusiasm?",
      "(Sometimes): The professor occasionally adds a lighthearted comment or dynamic element, but a lot of the lecture time remains pretty dry. How can instructors inject engaging storytelling and interactive media into core course modules?",
      "(Frequently): They bring immense energy, humor, and creative delivery to every single session, making the content incredibly entertaining and fun! How can educators sustain high delivery energy while preserving rigorous academic standards?"
    ]
  },

  // Column Z
  "column_z": {
    column: "Z",
    question: "Professor introduces controversy through content / career goals alignment",
    keys: ["relevance_4", "relevance_4s", "relevance_4p", "introduces_controversy", "academic_controversy"],
    prompts: [
      "(Rarely): The professor completely avoids controversial topics or career alignment, keeping content traditional. How can an instructor safely introduce structured academic debate or career relevance?",
      "(Sometimes): They occasionally introduce a viewpoint or career link, but more consistency is needed. How can instructors structure exercises to deepen critical thinking?",
      "(Frequently): They regularly introduce fascinating academic controversies and career connections, creating an incredible environment for lively debate and rigorous analysis!"
    ]
  },

  // Column AA
  "column_aa": {
    column: "AA",
    question: "Your professor uses semi-structured discussion format",
    keys: ["discuss_1", "discuss_1s", "discuss_1p", "semi_structured_discussion"],
    prompts: [
      "(Rarely): The professor relies almost entirely on traditional lectures and rarely organizes semi-structured discussions. What basic steps transition a traditional lecture to a semi-structured discussion format?",
      "(Sometimes): The professor occasionally incorporates semi-structured discussions into lessons. How can instructors structure discussion prompts to ensure high prep and flow?",
      "(Frequently): The professor consistently uses well-planned semi-structured discussions that balance guidance with student participation."
    ]
  },

  // Column AB
  "column_ab": {
    column: "AB",
    question: "Professor encourages students to discuss/analyze/debate",
    keys: ["discuss_2", "discuss_2s", "discuss_2p", "encourage_debate"],
    prompts: [
      "(Rarely): The professor seldom encourages students to discuss, analyze, or debate course topics. How can teachers introduce low-stakes pair debate techniques?",
      "(Sometimes): Students are occasionally invited to discuss or debate important topics. How can teachers elevate student debate to evidence-based analysis?",
      "(Frequently): The professor actively encourages students to analyze different viewpoints and debate ideas respectfully."
    ]
  },

  // Column AC
  "column_ac": {
    column: "AC",
    question: "Professor asks questions to students",
    keys: ["discuss_3", "discuss_3s", "discuss_3p", "asks_questions"],
    prompts: [
      "(Rarely): The professor rarely asks students questions during lectures, resulting in limited interaction. What questioning techniques stimulate passive classrooms?",
      "(Sometimes): The professor asks questions at certain points during the lecture to check understanding. How can instructors upgrade comprehension-check questions?",
      "(Frequently): The professor continuously engages students by asking thoughtful and challenging questions throughout the lesson."
    ]
  },

  // Column AD
  "column_ad": {
    column: "AD",
    question: "Professor steers discussions toward innovative and progressive ideas",
    keys: ["discuss_4", "discuss_4s", "discuss_4p", "steers_innovative"],
    prompts: [
      "(Rarely): Discussions rarely move beyond basic textbook concepts. How can an instructor guide open discussion toward novel, progressive ideas?",
      "(Sometimes): The professor occasionally redirects discussions toward fresh ideas. What scaffolding tools help instructors steer discussions toward innovation?",
      "(Frequently): The professor skillfully guides classroom discussions toward innovative and progressive ideas."
    ]
  },

  // Column AE
  "column_ae": {
    column: "AE",
    question: "Professor designs discussions to force analysis and conclusions",
    keys: ["discuss_5", "discuss_5s", "discuss_5p", "forces_analysis_conclusions"],
    prompts: [
      "(Rarely): Classroom discussions often remain informal and open-ended. How can instructors template discussion summaries to force evidence-backed conclusions?",
      "(Sometimes): The professor occasionally structures discussions to encourage analysis and logical conclusions. How can teachers ensure every discussion ends with clear key takeaways?",
      "(Frequently): Every discussion is carefully structured to require students to analyze evidence and reach well-supported conclusions."
    ]
  },

  // Column AF
  "column_af": {
    column: "AF",
    question: "Professor structures discussions to ensure participation from all students",
    keys: ["discuss_6", "discuss_6s", "discuss_6p", "ensure_participation_all"],
    prompts: [
      "(Rarely): Discussions are usually dominated by a small number of outspoken students. What equitable participation strategies ensure all voices are heard?",
      "(Sometimes): The professor makes occasional efforts to involve quieter students. How can teachers design small-group protocols that mandate contribution?",
      "(Frequently): The professor intentionally designs discussions so every student has an opportunity and expectation to contribute."
    ]
  },

  // Column AG
  "column_ag": {
    column: "AG",
    question: "Creates conditions that push participation in all activities",
    keys: ["act_part_1", "act_part_1s", "act_part_1p", "push_all_activities"],
    prompts: [
      "(Rarely): Students are rarely encouraged to actively participate in classroom activities beyond discussions. What interactive non-discussion activities engage quiet learners?",
      "(Sometimes): The professor occasionally designs activities that encourage broader student involvement. How can educators balance individual exercises and group tasks?",
      "(Frequently): The professor consistently creates engaging classroom activities that require every student to participate actively."
    ]
  },

  // Column AH
  "column_ah": {
    column: "AH",
    question: "Requires/mandates student participation in class activities",
    keys: ["act_part_2", "act_part_2s", "act_part_2p", "mandates_participation"],
    prompts: [
      "(Rarely): Participation in classroom activities is largely optional. How can participation rubrics be designed to mandate active contribution without anxiety?",
      "(Sometimes): The professor occasionally requires students to participate in classroom activities. How can instructors establish clear daily participation expectations?",
      "(Frequently): Active participation is expected in nearly every class activity, ensuring all students remain engaged."
    ]
  },

  // Column AI
  "column_ai": {
    column: "AI",
    question: "Administers group assignments to class",
    keys: ["act_part_3", "act_part_3s", "act_part_3p", "act_part. 3p", "group_assignments"],
    prompts: [
      "(Rarely): Group assignments are used very infrequently, giving students limited collaboration opportunities. How can teachers introduce short collaborative group tasks?",
      "(Sometimes): The professor occasionally assigns collaborative group projects. How can group assignment structures be optimized to prevent free-riding?",
      "(Frequently): The professor regularly incorporates group assignments into the course, encouraging teamwork and shared problem-solving."
    ]
  },

  // Column AJ
  "column_aj": {
    column: "AJ",
    question: "Involves students in hands-on activities",
    keys: ["act_part_4", "act_part_4s", "act_part_4p", "hands_on_activities"],
    prompts: [
      "(Rarely): The class relies mostly on lectures and theoretical explanations. What simple hands-on exercises or live simulations can be integrated?",
      "(Sometimes): Students occasionally engage in practical exercises or hands-on activities. How can instructors align hands-on lab exercises with exam objectives?",
      "(Frequently): Hands-on learning is a regular part of the course, allowing students to actively apply theoretical concepts."
    ]
  },

  // Column AK
  "column_ak": {
    column: "AK",
    question: "Uses games, simulations or has students teach the class",
    keys: ["act_part_5", "act_part_5s", "act_part_5p", "students_teach_class", "games_simulations"],
    prompts: [
      "(Rarely): Interactive teaching methods such as games or student teaching are rarely used. What lightweight gamification tools boost classroom interaction?",
      "(Sometimes): The professor occasionally incorporates games or student presentations. How can instructional activities be designed to reinforce complex concepts?",
      "(Frequently): The professor frequently uses interactive simulations, games, or student-led teaching methods."
    ]
  },

  // Column AL
  "column_al": {
    column: "AL",
    question: "Has students teach the class or assigns group problem-solving",
    keys: ["act_part_6", "act_part_6s", "act_part_6p", "group_problem_solving", "peer_teaching"],
    prompts: [
      "(Rarely): Students are rarely asked to present or engage in group problem solving. How can an instructor introduce collaborative problem-based learning?",
      "(Sometimes): The professor occasionally asks students to explain concepts or work in problem groups. How can presentation and group sessions be scaffolded?",
      "(Frequently): Students are regularly given opportunities to teach or tackle complex problem-solving in groups."
    ]
  },

  // Column AM
  "column_am": {
    column: "AM",
    question: "Assigns problem-solving or persuades students to be proactive",
    keys: ["act_part_7", "act_part_7s", "act_part_7p", "act_part_8", "act_part_8s", "act_part_8p", "proactive", "persuades_proactive", "group_problem_solving"],
    prompts: [
      "(Rarely): Group problem-solving or proactivity is rarely encouraged. How can instructors introduce low-stakes opportunities for initiative?",
      "(Sometimes): The professor occasionally assigns collaborative problem-solving and encourages proactivity. What techniques help transition proactive behaviors?",
      "(Frequently): The professor consistently assigns challenging group problem-solving and motivates students to take charge."
    ]
  },

  // Column AN
  "column_an": {
    column: "AN",
    question: "Percentage use of One-way lectures by professor",
    keys: ["methods_1", "methods_s_1", "methods_p_1", "one_way_lectures"],
    prompts: [
      "(Low — 0–33%): One-way lectures make up only a small portion of the teaching approach. How can instructors maintain structure when utilizing low-lecture methods?",
      "(Moderate — 34–66%): One-way lectures account for a substantial portion, balanced by discussions and group work. How can instructors optimize the balance?",
      "(High — 67–100%): One-way lectures dominate the teaching approach. What structured active learning elements can be integrated into high-lecture courses?"
    ]
  },

  // Column AO
  "column_ao": {
    column: "AO",
    question: "Percentage use of Interactive lectures",
    keys: ["methods_s_2", "methods_p_2", "interactive_lectures"],
    prompts: [
      "(Low — 0–33%): Interactive lectures are used infrequently. What are the first steps to convert standard lectures into interactive lectures?",
      "(Moderate — 34–66%): Interactive lectures are used regularly to provide a balance. How can instructors improve the cognitive level of student interactions?",
      "(High — 67–100%): Interactive lectures are a dominant teaching method, actively involving students through questions and discussions."
    ]
  },

  // Column AP
  "column_ap": {
    column: "AP",
    question: "Percentage use of PowerPoint-based one-way lectures",
    keys: ["methods_s_3", "methods_p_3", "powerpoint_lectures"],
    prompts: [
      "(Low — 0–33%): PowerPoint-based one-way lectures are used only occasionally. What alternative media or presentation styles can replace slides?",
      "(Moderate — 34–66%): PowerPoint-based one-way lectures form a moderate portion of the course. How can instructors design slides according to cognitive load theory?",
      "(High — 67–100%): PowerPoint-based one-way lectures dominate the course. How can instructors transition from 'death by PowerPoint' to slide-supported interaction?"
    ]
  },

  // Column AQ
  "column_aq": {
    column: "AQ",
    question: "Percentage use of PowerPoint-based interactive lectures / methods_p_19",
    keys: ["methods_s_4", "methods_p_19", "powerpoint_interactive"],
    prompts: [
      "(Low — 0–33%): Interactive PowerPoint lectures are used infrequently. How can slide decks be redesigned to prompt audience participation?",
      "(Moderate — 34–66%): Interactive slides are used regularly to spark discussion. How can slide-embedded polling or questions be optimized?",
      "(High — 67–100%): Interactive slides dominate delivery, continuously driving classroom engagement."
    ]
  },

  // Column AR
  "column_ar": {
    column: "AR",
    question: "Percentage use of Individual pen-paper assignments",
    keys: ["methods_s_5", "methods_p_5", "individual_assignments"],
    prompts: [
      "(Low — 0–33%): Individual pen-paper assignments are used infrequently. What simple individual written exercises can be added to class sessions?",
      "(Moderate — 34–66%): Individual pen-paper assignments are used regularly as one component. How can instructors provide prompt feedback without excessive overhead?",
      "(High — 67–100%): Individual pen-paper assignments make up a large portion of the teaching approach."
    ]
  },

  // Column AS
  "column_as": {
    column: "AS",
    question: "Percentage use of Interactive/group pen-paper assignments",
    keys: ["methods_s_6", "methods_p_6", "group_written_assignments"],
    prompts: [
      "(Low — 0–33%): Interactive or group pen-paper assignments are used infrequently. What are simple methods to convert individual exercises into small-group tasks?",
      "(Moderate — 34–66%): Group pen-paper assignments are used with moderate frequency. How can instructors ensure equal participation and fair grading?",
      "(High — 67–100%): Interactive or group pen-paper assignments are a major part of the course."
    ]
  },

  // Column AT
  "column_at": {
    column: "AT",
    question: "Percentage use of Individual/solo games",
    keys: ["methods_s_7", "methods_p_7", "individual_games"],
    prompts: [
      "(Low — 0–33%): Individual educational games are rarely used. What simple solo games or digital quizzes can be introduced?",
      "(Moderate — 34–66%): Individual games are used periodically to reinforce concepts. How can learning games be aligned with core learning outcomes?",
      "(High — 67–100%): Individual games are used extensively as a teaching strategy."
    ]
  },

  // Column AU
  "column_au": {
    column: "AU",
    question: "Percentage use of Interactive/group games",
    keys: ["methods_s_8", "methods_p_8", "group_games"],
    prompts: [
      "(Low — 0–33%): Interactive or group games are rarely used. What are simple ways to gamify group reviews?",
      "(Moderate — 34–66%): Group games are used periodically to encourage interaction and teamwork. How can group games encourage cooperative learning?",
      "(High — 67–100%): Interactive or group games are a major teaching method."
    ]
  },

  // Column AV
  "column_av": {
    column: "AV",
    question: "Percentage use of Individual/solo online assignments",
    keys: ["methods_s_9", "methods_p_9", "individual_online_assignments"],
    prompts: [
      "(Low — 0–33%): Individual online assignments are used infrequently. What basic online self-assessments can be integrated?",
      "(Moderate — 34–66%): Individual online assignments are used regularly. How can instructors utilize automated grading feedback?",
      "(High — 67–100%): Individual online assignments make up a large portion of the teaching approach."
    ]
  },

  // Column AW
  "column_aw": {
    column: "AW",
    question: "Percentage use of Interactive/group online assignments",
    keys: ["methods_s_10", "methods_p_10", "group_online_assignments"],
    prompts: [
      "(Low — 0–33%): Interactive or group online assignments are used infrequently. What tools introduce collaborative online homework?",
      "(Moderate — 34–66%): Group online assignments are used with moderate frequency. How can instructors manage communication hurdles?",
      "(High — 67–100%): Interactive or group online assignments are a major part of the course."
    ]
  },

  // Column AX
  "column_ax": {
    column: "AX",
    question: "Percentage use of Individual field assignments",
    keys: ["methods_s_11", "methods_p_11", "individual_field_assignments"],
    prompts: [
      "(Low — 0–33%): Individual field assignments are rarely used. How can instructors design short local observation tasks?",
      "(Moderate — 34–66%): Individual field assignments are used periodically. How can field observations reinforce theoretical lectures?",
      "(High — 67–100%): Individual field assignments are extensively used."
    ]
  },

  // Column AY
  "column_ay": {
    column: "AY",
    question: "Percentage use of Group field assignments",
    keys: ["methods_s_12", "methods_p_12", "group_field_assignments"],
    prompts: [
      "(Low — 0–33%): Group field assignments are rarely used. What beginner group field tasks can be designed?",
      "(Moderate — 34–66%): Group field assignments are used regularly enough to provide meaningful collaboration.",
      "(High — 67–100%): Group field assignments are a major teaching method."
    ]
  },

  // Column AZ
  "column_az": {
    column: "AZ",
    question: "Percentage use of Fill-in-the-blank notes",
    keys: ["methods_s_13", "methods_p_13", "fill_blank_notes"],
    prompts: [
      "(Low — 0–33%): Fill-in-the-blank notes are used infrequently. What guided note-taking sheets can be offered?",
      "(Moderate — 34–66%): Fill-in-the-blank notes are used periodically. How can instructors design notes that encourage active synthesis?",
      "(High — 67–100%): Fill-in-the-blank notes are used extensively."
    ]
  },

  // Column BA
  "column_ba": {
    column: "BA",
    question: "Percentage use of Teaching props/aids",
    keys: ["methods_s_14", "methods_p_14", "teaching_props"],
    prompts: [
      "(Low — 0–33%): Teaching props and visual aids are rarely used. What simple physical items or demo videos can be introduced?",
      "(Moderate — 34–66%): Teaching props and aids are used periodically. How can physical props be actively integrated into student activities?",
      "(High — 67–100%): Teaching aids are used extensively throughout the course."
    ]
  },

  // Column BB
  "column_bb": {
    column: "BB",
    question: "Percentage use of Articles or cases to read",
    keys: ["methods_s_15", "methods_p_15", "articles_read"],
    prompts: [
      "(Low — 0–33%): Articles or case materials are rarely assigned. What introductory case analyses can be assigned?",
      "(Moderate — 34–66%): Articles and case materials are assigned periodically. How can instructors guide student reading using active reading guides?",
      "(High — 67–100%): Articles and cases are used extensively."
    ]
  },

  // Column BC
  "column_bc": {
    column: "BC",
    question: "Percentage use of Any other teaching method (1)",
    keys: ["methods_s_16", "methods_p_16", "other_method_1"],
    prompts: [
      "(Low — 0–33%): Additional teaching methods are used infrequently. What other pedagogy styles could be explored?",
      "(Moderate — 34–66%): Additional teaching methods are used periodically. How can instructors evaluate non-standard methods?",
      "(High — 67–100%): Additional teaching methods are used extensively."
    ]
  },

  // Column BD
  "column_bd": {
    column: "BD",
    question: "Any other teaching method (1) — Text",
    keys: ["methods_s_16_text", "methods_p_16_text"],
    prompts: []
  },

  // Column BE
  "column_be": {
    column: "BE",
    question: "Percentage use of Any other teaching method (2)",
    keys: ["methods_s_17", "methods_p_17", "other_method_2"],
    prompts: [
      "(Low — 0–33%): The additional teaching method is used infrequently and has a limited role.",
      "(Moderate — 34–66%): The additional teaching method is used with moderate frequency.",
      "(High — 67–100%): The additional teaching method is used extensively."
    ]
  },

  // Column BF
  "column_bf": {
    column: "BF",
    question: "Any other teaching method (2) — Text",
    keys: ["methods_s_17_text", "methods_p_17_text"],
    prompts: []
  },

  // Column BG
  "column_bg": {
    column: "BG",
    question: "Percentage use of Any other teaching method (3)",
    keys: ["methods_s_18", "methods_p_18", "other_method_3"],
    prompts: [
      "(Low — 0–33%): The additional teaching method is used infrequently.",
      "(Moderate — 34–66%): The additional teaching method is used periodically.",
      "(High — 67–100%): The additional teaching method is used extensively."
    ]
  },

  // Column BH
  "column_bh": {
    column: "BH",
    question: "Any other teaching method (3) — Text",
    keys: ["methods_s_18_text", "methods_p_18_text"],
    prompts: []
  },

  // Column BI
  "column_bi": {
    column: "BI",
    question: "Class materials provided by the professor are well organized",
    keys: ["cls_org_1s", "cls_org_1p", "materials_organized"],
    prompts: [
      "(Rarely — 1–2): Class materials are often disorganized or difficult to navigate. What syllabus layout standards best reduce student cognitive load?",
      "(Sometimes — 3–5): The professor generally provides reasonably organized materials. How can instructors catalog resources into weekly modules?",
      "(Frequently — 6–7): The professor consistently provides well-organized, clearly structured materials."
    ]
  },

  // Column BJ
  "column_bj": {
    column: "BJ",
    question: "Your professor outlines expectations clearly early on",
    keys: ["cls_org_2s", "cls_org_2p", "expectations_clear"],
    prompts: [
      "(Rarely — 1–2): The professor rarely communicates expectations clearly at the beginning. What introductory strategies help align expectations?",
      "(Sometimes — 3–5): The professor communicates some expectations early, but certain requirements may remain unclear.",
      "(Frequently — 6–7): The professor clearly explains course expectations early on, giving students a strong understanding."
    ]
  },

  // Column BK
  "column_bk": {
    column: "BK",
    question: "Your professor regularly clears up any confusion",
    keys: ["cls_org_3s", "cls_org_3p", "clears_confusion"],
    prompts: [
      "(Rarely): The professor almost never stops to check for understanding, leaving students confused. What formative assessment techniques gauge confusion?",
      "(Sometimes): The professor occasionally addresses questions if asked. How can instructors proactively check for understanding?",
      "(Frequently): The professor consistently pauses to check understanding and proactively clear up doubts."
    ]
  },

  // Column BL
  "column_bl": {
    column: "BL",
    question: "Your professor's thoughts are well organized in each session",
    keys: ["cls_org_4s", "cls_org_4p", "thoughts_organized"],
    prompts: [
      "(Rarely): The professor jumps randomly from topic to topic. What lesson-planning frameworks help structure thoughts in a logical order?",
      "(Sometimes): The instructor usually has a basic outline, but occasionally goes off on tangents. How can instructors use visual signposts?",
      "(Frequently): The professor presents every concept in a perfectly structured and logical order."
    ]
  },

  // Column BM
  "column_bm": {
    column: "BM",
    question: "Notes and other materials provided are straightforward and easy to follow",
    keys: ["cls_org_5s", "cls_org_5p", "notes_straightforward"],
    prompts: [
      "(Rarely): Materials provided are convoluted and messy. What are key design guidelines for clear lecture slides?",
      "(Sometimes): The instructor provides notes that are mostly helpful, but some sections lack clarity.",
      "(Frequently): The professor consistently provides impeccably clear and straightforward materials."
    ]
  },

  // Column BN
  "column_bn": {
    column: "BN",
    question: "Your professor presents unfamiliar material so students can connect with it",
    keys: ["challenge_level_1s", "challenge_level_1p", "presents_unfamiliar"],
    prompts: [
      "(Rarely): The professor introduces new concepts without background context. What anchoring techniques help connect new information?",
      "(Sometimes): The instructor occasionally tries to bridge the gap when introducing new topics.",
      "(Frequently): The professor consistently uses brilliant analogies to introduce new topics."
    ]
  },

  // Column BO
  "column_bo": {
    column: "BO",
    question: "Students are frequently made to put their knowledge to test",
    keys: ["challenge_level_2s", "challenge_level_2p", "knowledge_tested"],
    prompts: [
      "(Rarely): The professor almost never gives quizzes or practical assignments. What low-stakes testing techniques improve retention?",
      "(Sometimes): The instructor occasionally assigns a short quiz or exercise.",
      "(Frequently): The professor consistently challenges students with engaging quizzes and practical exercises."
    ]
  },

  // Column BP
  "column_bp": {
    column: "BP",
    question: "Students don't feel overwhelmed with homework and projects",
    keys: ["challenge_level_3s", "challenge_level_3p", "homework_overwhelmed"],
    prompts: [
      "(Rarely): The professor assigns an unreasonable amount of homework. How can instructors calculate workload hours accurately?",
      "(Sometimes): The instructor attempts to balance workload, but sudden influxes occur.",
      "(Frequently): The professor paces all assignments and projects perfectly across the syllabus."
    ]
  },

  // Column BQ
  "column_bq": {
    column: "BQ",
    question: "Projects and assignments have optimal level of challenge",
    keys: ["challenge_level_4s", "challenge_level_4p", "optimal_challenge"],
    prompts: [
      "(Rarely): Assignments are either mind-numbingly easy or impossibly hard. How can assignments be designed to match skill levels?",
      "(Sometimes): The instructor occasionally hits the sweet spot with difficulty.",
      "(Frequently): The professor perfectly balances difficulty, providing the optimal level of challenge."
    ]
  },

  // Column BR
  "column_br": {
    column: "BR",
    question: "How often does your professor know students by name",
    keys: ["cncts_1s", "cncts_1p", "know_names"],
    prompts: [
      "(Rarely): The professor almost never takes time to learn names. What practical strategies help memorize names?",
      "(Sometimes): The instructor knows a handful of names, usually those who speak up.",
      "(Frequently): The professor makes an incredible effort to memorize every single student's name."
    ]
  },

  // Column BS
  "column_bs": {
    column: "BS",
    question: "How often does your professor take time to know students personally",
    keys: ["cncts_2s", "cncts_2p", "know_personally"],
    prompts: [
      "(Rarely): The professor strictly focuses on academic material. What are simple ways to discover student interests?",
      "(Sometimes): The instructor occasionally makes small talk before or after class.",
      "(Frequently): The professor actively engages in meaningful conversations about lives and goals."
    ]
  },

  // Column BT
  "column_bt": {
    column: "BT",
    question: "How often does your professor relate/connect with students and their situation",
    keys: ["cncts_3s", "cncts_3p", "relate_connect"],
    prompts: [
      "(Rarely): The professor seems completely out of touch with student life. How can instructors build flexible course policies?",
      "(Sometimes): The instructor occasionally acknowledges pressures but struggles to genuinely relate.",
      "(Frequently): The professor demonstrates incredible empathy and understanding."
    ]
  },

  // Column BU
  "column_bu": {
    column: "BU",
    question: "How often does your professor keep a friendly attitude towards students",
    keys: ["cncts_4s", "cncts_4p", "friendly_attitude"],
    prompts: [
      "(Rarely): The professor maintains a cold and unapproachable demeanor. What immediacy behaviors make a teacher approachable?",
      "(Sometimes): The instructor is generally polite but keeps a strict professional distance.",
      "(Frequently): The professor consistently radiates warmth and positivity."
    ]
  },

  // Column BV
  "column_bv": {
    column: "BV",
    question: "How often does your professor engage students outside the classroom",
    keys: ["cncts_5s", "cncts_5p", "engage_outside"],
    prompts: [
      "(Rarely): The professor strictly limits interactions to lecture time. How can office hours be restructured?",
      "(Sometimes): The instructor is available during standard office hours, but outside engagement is limited.",
      "(Frequently): The professor actively organizes study groups and engages outside the classroom."
    ]
  },

  // Column BW
  "column_bw": {
    column: "BW",
    question: "To what extent is your professor interested in student opinions and feedback",
    keys: ["cncts_6s", "cncts_6p", "interested_feedback"],
    prompts: [
      "(Rarely): The professor completely ignores opinions and never asks for feedback. What simple methods can solicit input?",
      "(Sometimes): The instructor occasionally asks for thoughts or sends surveys.",
      "(Frequently): The professor actively seeks out opinions and consistently implements feedback."
    ]
  },

  // Column BX
  "column_bx": {
    column: "BX",
    question: "Teacher's excitement/energy for the class",
    keys: ["p_attrib_1", "teacher_excitement", "energy"],
    prompts: [
      "(Rarely): The professor brings almost no energy, presenting with flat delivery. What vocal variation techniques re-energize class?",
      "(Sometimes): The instructor shows occasional bursts of enthusiasm for specific topics.",
      "(Frequently): The professor consistently brings high energy and infectious excitement."
    ]
  },

  // Column BY
  "column_by": {
    column: "BY",
    question: "Teacher's laid back / relaxed attitude towards class",
    keys: ["p_attrib_2", "laid_back", "relaxed_attitude"],
    prompts: [
      "(Rarely): The professor is rigid and intense, creating an overly stressful environment. How can a relaxed environment be established?",
      "(Sometimes): The instructor maintains a mostly strict and formal approach.",
      "(Frequently): The professor brings an easygoing and laid-back attitude, creating a stress-free space."
    ]
  },

  // Column BZ
  "column_bz": {
    column: "BZ",
    question: "How much teacher cares about student learning",
    keys: ["p_attrib_3", "cares_learning"],
    prompts: [
      "(Rarely): The professor seems indifferent to whether students grasp material. What visible behaviors communicate care?",
      "(Sometimes): The instructor occasionally pauses to check understanding but prioritizes finishing the syllabus.",
      "(Frequently): The professor demonstrates incredible dedication to academic success."
    ]
  },

  // Column CA
  "column_ca": {
    column: "CA",
    question: "How much teacher cares about the subject being taught",
    keys: ["p_attrib_4", "cares_subject"],
    prompts: [
      "(Rarely): The professor shows absolutely no passion, reading directly from the textbook. How can instructors rediscover interest?",
      "(Sometimes): The instructor seems interested in certain parts of the syllabus.",
      "(Frequently): The professor is incredibly passionate about the subject, bringing infectious enthusiasm."
    ]
  },

  // Column CB
  "column_cb": {
    column: "CB",
    question: "How knowledgeable instructor is",
    keys: ["p_attrib_5", "professor_knowledge"],
    prompts: [
      "(Rarely): The professor rarely demonstrates deep understanding, struggling with basic questions. What prep strategies help manage advanced questions?",
      "(Sometimes): The instructor displays a good grasp of core concepts but occasionally fumbles complex questions.",
      "(Frequently): The professor demonstrates deep mastery, effortlessly answering complex questions."
    ]
  },

  // Column CC
  "column_cc": {
    column: "CC",
    question: "How easy it is to approach professor",
    keys: ["p_attrib_6", "easy_approach"],
    prompts: [
      "(Rarely): The professor is intimidating and almost never available. What behaviors break down approachability barriers?",
      "(Sometimes): The instructor is polite but often seems too busy.",
      "(Frequently): The professor maintains a welcoming and open demeanor, making it easy to approach."
    ]
  },

  // Column CD
  "column_cd": {
    column: "CD",
    question: "Extent personality reflects in interactions",
    keys: ["p_attrib_7", "personality_reflect"],
    prompts: [
      "(Rarely): The professor maintains a strictly formal and robotic demeanor. How can instructors safely reveal aspects of their personality?",
      "(Sometimes): The instructor occasionally shows personal flair or humor.",
      "(Frequently): The professor brings their authentic self, letting their vibrant personality shine through."
    ]
  },

  // Column CE
  "column_ce": {
    column: "CE",
    question: "Teacher's sense of humor / p_attrib_8",
    keys: ["p_attrib_8", "10-p.attrib_8", "sense_humor"],
    prompts: [
      "(Rarely): The professor is serious and almost never uses humor. How can lighthearted humor reduce tension?",
      "(Sometimes): The instructor occasionally cracks a joke or lightens the mood.",
      "(Frequently): The professor incorporates an incredible sense of humor into lessons."
    ]
  },

  // Column CF
  "column_cf": {
    column: "CF",
    question: "How often teacher uses humor or laughs at oneself",
    keys: ["p_attrib_9", "use_humor", "laugh_oneself"],
    prompts: [
      "(Rarely): The professor takes everything extremely seriously and never laughs at oneself. How can self-deprecating humor normalize mistakes?",
      "(Sometimes): The instructor occasionally makes a lighthearted remark or chuckles at a personal mistake.",
      "(Frequently): The professor regularly uses delightful self-deprecating humor and easily laughs at oneself."
    ]
  }
};

/**
 * Fallback prompt generator for any feature or variable name NOT explicitly present.
 * In strict mode, returns null or empty array instead of generic placeholders.
 */
export function generateFallbackPrompts(varName, strict = false) {
  if (strict) return [];
  const cleanName = String(varName || "Selected Feature").replace(/_/g, ' ').trim();
  return [
    `Low evaluation scores were observed for '${cleanName}'. Based on academic literature in higher education and pedagogical design, what are primary root causes and basic starting steps?`,
    `Analyzing student/teacher feedback on '${cleanName}': What specific instructional interventions or structural adjustments do research papers recommend?`,
    `To achieve high pedagogical standards for '${cleanName}', what evidence-based strategies can an instructor deploy?`
  ];
}

/**
 * Standardize feature variable names by normalizing prefixes, infixes, and suffixes.
 * e.g., content_s_1, content_p_1, content_1 -> content1
 *       relevance_1s, relevance_1p, relevance_1 -> relevance1
 *       discuss_1s, discuss_1p, discuss_1 -> discuss1
 *       methods_s_1, methods_p_1, methods_1 -> methods1
 */
export function normalizeFeatureKey(key) {
  if (!key) return "";
  let k = String(key).toLowerCase().trim();
  k = k.replace(/^([a-z0-9]+)_[sp]_?(\d+)$/i, "$1_$2");
  k = k.replace(/^([a-z_]+?)_?(\d+)[sp]$/i, "$1_$2");
  return k.replace(/[_.\s-]/g, "");
}

/**
 * Retrieve prompt details for any variable name, column letter, or question title.
 * Options: { strictDynamic: boolean, promptIndex: number, returnNullOnNoMatch: boolean }
 */
export function getRandomPromptForVariable(variableIdentifier, options = {}) {
  if (!variableIdentifier) {
    if (options.strictDynamic || options.returnNullOnNoMatch) return null;
    return {
      variable: "General Evaluation",
      question: "Overall Course Evaluation",
      column: "General",
      prompt: generateFallbackPrompts("General Evaluation")[0],
      promptIndex: 0
    };
  }

  const rawKey = String(variableIdentifier).toLowerCase().trim();
  const cleanKey = rawKey.replace(/[_.\s-]/g, '');
  const normKey = normalizeFeatureKey(variableIdentifier);

  let matchedEntry = null;

  // 1. Direct match by Column Object Key (e.g. "column_q", "column_cf")
  if (COLUMN_PROMPTS[rawKey]) {
    matchedEntry = COLUMN_PROMPTS[rawKey];
  }

  // 2. Direct match by Column Letter (e.g. "Q", "CF")
  if (!matchedEntry) {
    for (const item of Object.values(COLUMN_PROMPTS)) {
      if (item.column.toLowerCase() === rawKey) {
        matchedEntry = item;
        break;
      }
    }
  }

  // 3. Exact Canonical Feature Match (e.g. "content_1" strictly matches "content_s_1", "content_p_1", "content_1")
  if (!matchedEntry && normKey) {
    for (const item of Object.values(COLUMN_PROMPTS)) {
      if (item.keys && item.keys.some(k => normalizeFeatureKey(k) === normKey)) {
        matchedEntry = item;
        break;
      }
    }
  }

  // 4. Exact raw key or cleaned string match across keys array
  if (!matchedEntry) {
    for (const item of Object.values(COLUMN_PROMPTS)) {
      const keyMatch = item.keys && item.keys.some((k) => {
        const kLow = k.toLowerCase();
        const kClean = kLow.replace(/[_.\s-]/g, '');
        return kLow === rawKey || kClean === cleanKey;
      });
      if (keyMatch) {
        matchedEntry = item;
        break;
      }
    }
  }

  // 5. Title / Question text match
  if (!matchedEntry) {
    for (const item of Object.values(COLUMN_PROMPTS)) {
      const titleMatch =
        item.question.toLowerCase().includes(rawKey) ||
        (rawKey.length > 4 && item.question.toLowerCase().includes(rawKey.replace(/_/g, ' ')));
      if (titleMatch) {
        matchedEntry = item;
        break;
      }
    }
  }

  let availablePrompts = [];
  let questionTitle = String(variableIdentifier).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let columnLetter = "Custom";

  if (matchedEntry && matchedEntry.prompts && matchedEntry.prompts.length > 0) {
    availablePrompts = matchedEntry.prompts;
    questionTitle = matchedEntry.question;
    columnLetter = matchedEntry.column;
  } else {
    // STRICT MODE: If strictDynamic is enabled or no prompts exist for metadata/text fields
    if (options.strictDynamic || options.returnNullOnNoMatch || (matchedEntry && matchedEntry.prompts.length === 0)) {
      return null;
    }
    availablePrompts = generateFallbackPrompts(variableIdentifier, options.strictDynamic);
    if (availablePrompts.length === 0) return null;
  }

  let chosenIndex = 0;
  if (typeof options.promptIndex === 'number' && options.promptIndex >= 0 && options.promptIndex < availablePrompts.length) {
    chosenIndex = options.promptIndex;
  } else {
    chosenIndex = Math.floor(Math.random() * availablePrompts.length);
  }

  return {
    variable: variableIdentifier,
    question: questionTitle,
    column: columnLetter,
    prompt: availablePrompts[chosenIndex],
    promptIndex: chosenIndex + 1,
    allPrompts: availablePrompts
  };
}