import type { Gender } from "@/lib/types";

export type VIPCelebrity = {
  id: string;
  name: string;
  gender: Gender;
  imageUrl: string;
};

const CROWN_FALLBACK_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>",
  "<defs>",
  "<linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>",
  "<stop offset='0%' stop-color='#0a1228'/>",
  "<stop offset='100%' stop-color='#050814'/>",
  "</linearGradient>",
  "<linearGradient id='c' x1='0' y1='0' x2='1' y2='1'>",
  "<stop offset='0%' stop-color='#fde68a'/>",
  "<stop offset='100%' stop-color='#f59e0b'/>",
  "</linearGradient>",
  "</defs>",
  "<rect width='800' height='1000' fill='url(#bg)'/>",
  "<circle cx='400' cy='450' r='145' fill='rgba(255,255,255,0.04)'/>",
  "<path d='M255 555h290l-22 102H277l-22-102Zm10-8 68-112 67 68 68-68 67 112H265Z' fill='url(#c)'/>",
  "</svg>"
].join("");

export const VIP_PORTRAIT_FALLBACK_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CROWN_FALLBACK_SVG)}`;

export const VIP_MEN: VIPCelebrity[] = [
  {
    id: 'vip-man-1',
    name: 'Cristiano Ronaldo',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/President_Donald_Trump_meets_with_Cristiano_Ronaldo_in_the_Oval_Office_%2854933344262%29_%28cropped_and_rotated%29.jpg'
  },
  {
    id: 'vip-man-2',
    name: 'Lionel Messi',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Lionel_Messi_White_House_2026_%283x4_cropped%29.jpg'
  },
  {
    id: 'vip-man-3',
    name: 'Elon Musk',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/1280px-Elon_Musk_-_54820081119_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-4',
    name: 'MrBeast',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/MrBeast_2023_%28cropped%29.jpg/1280px-MrBeast_2023_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-5',
    name: 'Dwayne Johnson',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Dwayne_Johnson-1764_%284x5_cropped_with_moderate_headroom%29.jpg/1280px-Dwayne_Johnson-1764_%284x5_cropped_with_moderate_headroom%29.jpg'
  },
  {
    id: 'vip-man-6',
    name: 'Justin Bieber',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Justin_Bieber_in_2015.jpg'
  },
  {
    id: 'vip-man-7',
    name: 'Drake',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-8',
    name: 'Neymar Jr.',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Neymar_Jr._with_Al_Hilal%2C_3_October_2023_-_03_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-9',
    name: 'LeBron James',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg'
  },
  {
    id: 'vip-man-10',
    name: 'The Weeknd',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/1280px-The_Weeknd_Portrait_by_Brian_Ziff.jpg'
  },
  {
    id: 'vip-man-11',
    name: 'Harry Styles',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg/1280px-HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg'
  },
  {
    id: 'vip-man-12',
    name: 'Mark Zuckerberg',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Mark_Zuckerberg_in_September_2025_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-13',
    name: 'Jeff Bezos',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/260202-D-PM193-2205_SECWAR_Arsenal_of_Freedom_Tour_-_Florida_%283x4_cropped_on_Bezos_and_rotated%29.jpg'
  },
  {
    id: 'vip-man-14',
    name: 'Tom Cruise',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tom_Cruise_at_53rd_Saturn_Awards_2026-01.jpg/1280px-Tom_Cruise_at_53rd_Saturn_Awards_2026-01.jpg'
  },
  {
    id: 'vip-man-15',
    name: 'Keanu Reeves',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg/1280px-Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg'
  },
  {
    id: 'vip-man-16',
    name: 'Kylian Mbappé',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Picture_with_Mbapp%C3%A9_%28cropped_and_rotated%29.jpg'
  },
  {
    id: 'vip-man-17',
    name: 'Virat Kohli',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Virat_Kohli_in_PMO_New_Delhi.jpg'
  },
  {
    id: 'vip-man-18',
    name: 'Ryan Reynolds',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg/1280px-Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-19',
    name: 'Ed Sheeran',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/1280px-Ed_Sheeran-6886_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-20',
    name: 'Stephen Curry',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Stephen_Curry%2C_Olympic_Games_2024_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-21',
    name: 'Robert Downey Jr.',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Robert_Downey_Jr._2014_Comic-Con.jpg/1280px-Robert_Downey_Jr._2014_Comic-Con.jpg'
  },
  {
    id: 'vip-man-22',
    name: 'Mohamed Salah',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mohamed_Salah_2018.jpg'
  },
  {
    id: 'vip-man-23',
    name: 'Bad Bunny',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Bad_Bunny_2019_by_Glenn_Francis_%28cropped%29.jpg/1280px-Bad_Bunny_2019_by_Glenn_Francis_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-24',
    name: 'Leonardo DiCaprio',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/LeoPTABFI191125-28_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-25',
    name: 'Novak Djokovic',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Novak_Djokovic_2024_Paris_Olympics.jpg/1280px-Novak_Djokovic_2024_Paris_Olympics.jpg'
  },
  {
    id: 'vip-man-26',
    name: 'Travis Scott',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/2025-0120_Cole_Gahagan_Michael_Rubin_Travis_Scott_%28cropped%29.jpg/1280px-2025-0120_Cole_Gahagan_Michael_Rubin_Travis_Scott_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-27',
    name: 'Chris Hemsworth',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Chris_Hemsworth_-_Crime_101.jpg/1280px-Chris_Hemsworth_-_Crime_101.jpg'
  },
  {
    id: 'vip-man-28',
    name: 'Erling Haaland',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Erling_Haaland_June_2025.jpg/1280px-Erling_Haaland_June_2025.jpg'
  },
  {
    id: 'vip-man-29',
    name: 'Donald Trump',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg/1280px-Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg'
  },
  {
    id: 'vip-man-30',
    name: 'Barack Obama',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/1280px-President_Barack_Obama.jpg'
  },
  {
    id: 'vip-man-31',
    name: 'Eminem',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Eminem_2021_Color_Corrected.jpg'
  },
  {
    id: 'vip-man-32',
    name: 'Johnny Depp',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Johnny_Depp_2020.jpg'
  },
  {
    id: 'vip-man-33',
    name: 'Karim Benzema',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Karim_Benzema_Pick.jpg'
  },
  {
    id: 'vip-man-34',
    name: 'Luka Modrić',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Ofrenda_de_la_Liga_y_la_Champions-57-L.Mill%C3%A1n_%2852109310843%29_%28Luka_Modri%C4%87%29.jpg'
  },
  {
    id: 'vip-man-35',
    name: 'Kevin Durant',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Kevin_Durant%2C_Paris_2024_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-36',
    name: 'Bruno Mars',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-37',
    name: 'Post Malone',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Post_Malone_July_2021_%28cropped%29.jpg/1280px-Post_Malone_July_2021_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-38',
    name: 'Timothée Chalamet',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg/1280px-Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-39',
    name: 'Bill Gates',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Bill_Gates_at_the_European_Commission_-_P067383-987995_%28cropped%29_5.jpg'
  },
  {
    id: 'vip-man-40',
    name: 'Cillian Murphy',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Cillian_Murphy_at_the_London_premier_of_Steve_in_September_2025_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-41',
    name: 'Jude Bellingham',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-42',
    name: 'Kanye West',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Kanye_West_at_the_2009_Tribeca_Film_Festival_%28crop_2%29.jpg/1280px-Kanye_West_at_the_2009_Tribeca_Film_Festival_%28crop_2%29.jpg'
  },
  {
    id: 'vip-man-43',
    name: 'Conor McGregor',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Conor_McGregor_2025.jpeg/1280px-Conor_McGregor_2025.jpeg'
  },
  {
    id: 'vip-man-44',
    name: 'Lewis Hamilton',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg/1280px-Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-45',
    name: 'Will Smith',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_%2848834070763%29_%28cropped%29.jpg/1280px-TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_%2848834070763%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-46',
    name: 'Shaquille O\'Neal',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/TechCrunch_Disrupt_2023_-_Day_1_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-47',
    name: 'J Balvin',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/J_Balvin%2C_Noisey_Meets%3B_Oct_2018.jpg'
  },
  {
    id: 'vip-man-48',
    name: 'Shawn Mendes',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/191125_Shawn_Mendes_at_the_2019_American_Music_Awards.png'
  },
  {
    id: 'vip-man-49',
    name: 'Vinícius Júnior',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/2023_05_06_Final_de_la_Copa_del_Rey_-_52879242230_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-50',
    name: 'Jason Momoa',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jason_Momoa_%2843055621224%29_%28cropped%29.jpg/1280px-Jason_Momoa_%2843055621224%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-51',
    name: 'Brad Pitt',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Brad_Pitt-69858.jpg/1280px-Brad_Pitt-69858.jpg'
  },
  {
    id: 'vip-man-52',
    name: 'Snoop Dogg',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Snoop_Dogg_2023_%2853775197331%29_%28cropped%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-53',
    name: 'Andrew Garfield',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Andrew_Garfield_82nd_Venice_Film_Festival_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-54',
    name: 'Rafael Nadal',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Rafael_Nadal_en_2024_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-55',
    name: 'Carlos Alcaraz',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Carlos_Alcaraz_2025_FO.jpg'
  },
  {
    id: 'vip-man-56',
    name: 'Henry Cavill',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Henry_Cavill_%2848417913146%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-57',
    name: 'Narendra Modi',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/The_official_portrait_of_Shri_Narendra_Modi%2C_the_Prime_Minister_of_the_Republic_of_India.jpg'
  },
  {
    id: 'vip-man-58',
    name: 'Zlatan Ibrahimović',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Zlatan_Ibrahimovi%C4%87_June_2018.jpg'
  },
  {
    id: 'vip-man-59',
    name: '50 Cent',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Curtis_%2250_Cent%22_Jackson_visits_Barksdale_AFB_%285%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-60',
    name: 'Giannis Antetokounmpo',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Giannis_Antetokounmpo_%2851915153421%29_%28cropped%29.jpg/1280px-Giannis_Antetokounmpo_%2851915153421%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-61',
    name: 'Hugh Jackman',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Hugh_Jackman_by_Gage_Skidmore_3.jpg/1280px-Hugh_Jackman_by_Gage_Skidmore_3.jpg'
  },
  {
    id: 'vip-man-62',
    name: 'Rodrygo',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Rodrygo_2023_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-63',
    name: 'Peso Pluma',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Peso_Pluma%2C_performing_in_Monterrey_%282024-09-24%29_%281%29.png'
  },
  {
    id: 'vip-man-64',
    name: 'Pedro Pascal',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pedro_Pascal_at_the_2025_Cannes_Film_Festival_04.jpg/1280px-Pedro_Pascal_at_the_2025_Cannes_Film_Festival_04.jpg'
  },
  {
    id: 'vip-man-65',
    name: 'Lamine Yamal',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lamine_Yamal_in_2025.jpg/1280px-Lamine_Yamal_in_2025.jpg'
  },
  {
    id: 'vip-man-66',
    name: 'Jackie Chan',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Jackie_Chan.jpg'
  },
  {
    id: 'vip-man-67',
    name: 'Arnold Schwarzenegger',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Arnold_Schwarzenegger_2025_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-68',
    name: 'Ozuna',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Ozuna-2019.jpg'
  },
  {
    id: 'vip-man-69',
    name: 'Rowan Atkinson',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Rowan_Atkinson%2C_2011.jpg'
  },
  {
    id: 'vip-man-70',
    name: 'Sergio Ramos',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Sergio_Ramos_Interview_2021_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-71',
    name: 'Ben Affleck',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Ben_Affleck_on_the_Red_Carpet%2C_SXSW_2023_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-72',
    name: 'Charlie Puth',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Charlie_Puth.jpg/1280px-Charlie_Puth.jpg'
  },
  {
    id: 'vip-man-73',
    name: 'Josko Gvardiol',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2611_%28Jo%C5%A1ko_Gvardiol%29.jpg/1280px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2611_%28Jo%C5%A1ko_Gvardiol%29.jpg'
  },
  {
    id: 'vip-man-74',
    name: 'Nikola Jokić',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Nikola_Jokic_free_throw_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-75',
    name: 'Morgan Freeman',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Morgan_Freeman_at_The_Pentagon_on_2_August_2023_-_230802-D-PM193-3363_%28cropped%29.jpg/1280px-Morgan_Freeman_at_The_Pentagon_on_2_August_2023_-_230802-D-PM193-3363_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-76',
    name: 'Zayn Malik',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Zayn_Wiki_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-77',
    name: 'Manuel Neuer',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/20180602_FIFA_Friendly_Match_Austria_vs._Germany_Manuel_Neuer_850_0723.jpg/1280px-20180602_FIFA_Friendly_Match_Austria_vs._Germany_Manuel_Neuer_850_0723.jpg'
  },
  {
    id: 'vip-man-78',
    name: 'Chris Evans',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Chris_Evans_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-79',
    name: 'Future',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Future_-_Openair_Frauenfeld_2019_01_%28cropped%29.jpg/1280px-Future_-_Openair_Frauenfeld_2019_01_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-80',
    name: 'Kevin De Bruyne',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg/1280px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-81',
    name: 'Daniel Radcliffe',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/DanielRadcliffe.jpg/1280px-DanielRadcliffe.jpg'
  },
  {
    id: 'vip-man-82',
    name: 'Usher',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Usher_Milan_2026.jpg'
  },
  {
    id: 'vip-man-83',
    name: 'Jannik Sinner',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Jannik_Sinner_2025_US_Open.jpg'
  },
  {
    id: 'vip-man-84',
    name: 'Adam Sandler',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Jackie_Sandler_Adam_Sandler_Jay_Kelly-36_%283x4%29.jpg'
  },
  {
    id: 'vip-man-85',
    name: 'Jason Derulo',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Jason_Derulo_2.0.jpg'
  },
  {
    id: 'vip-man-86',
    name: 'Anthony Edwards',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Anthony_Edwards_Kentavious_Caldwell-Pope_%2851734745028%29_%28cropped%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-87',
    name: 'Tom Holland',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2_%28cropped%29.jpg/1280px-Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-88',
    name: 'Lil Baby',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Lil_Baby_2023.png'
  },
  {
    id: 'vip-man-89',
    name: 'Riyad Mahrez',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Mahrez_2021.jpg'
  },
  {
    id: 'vip-man-90',
    name: 'Matt Damon',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/MattDamon-byPhilipRomano.jpg/1280px-MattDamon-byPhilipRomano.jpg'
  },
  {
    id: 'vip-man-91',
    name: 'Central Cee',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Central_cee-5.jpg/1280px-Central_cee-5.jpg'
  },
  {
    id: 'vip-man-92',
    name: 'Devin Booker',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Devin_Booker%2C_Olympic_Games_2024_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-93',
    name: 'Mads Mikkelsen',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Mads_Mikkelsen_at_82nd_Venice_International_Film_Festival_%28cropped2%29.jpg/1280px-Mads_Mikkelsen_at_82nd_Venice_International_Film_Festival_%28cropped2%29.jpg'
  },
  {
    id: 'vip-man-95',
    name: 'Son Heung-min',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg/1280px-BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-96',
    name: 'Al Pacino',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Al_Pacino_2016_%2830401544240%29.jpg'
  },
  {
    id: 'vip-man-97',
    name: 'Tyler, The Creator',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Tyler_the_Creator_%2852163761341%29_%28cropped%29.jpg/1280px-Tyler_the_Creator_%2852163761341%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-98',
    name: 'Damian Lillard',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Damian_Lillard_%282021%29_%28cropped%29.jpg/1280px-Damian_Lillard_%282021%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-man-99',
    name: 'Sylvester Stallone',
    gender: 'male',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/P20251206DT-0472_%283x4_cropped_on_Stallone_with_moderate_headroom%29.jpg'
  }
];

export const VIP_WOMEN: VIPCelebrity[] = [
  {
    id: 'vip-woman-1',
    name: 'Taylor Swift',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/1280px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png'
  },
  {
    id: 'vip-woman-2',
    name: 'Selena Gomez',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Selena_Gomez_at_the_2024_Toronto_International_Film_Festival_10_%28cropped%29.jpg/1280px-Selena_Gomez_at_the_2024_Toronto_International_Film_Festival_10_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-3',
    name: 'Kylie Jenner',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Kylie_Jenner1_%28cropped%29.png'
  },
  {
    id: 'vip-woman-4',
    name: 'Kim Kardashian',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Kim_Kardashian_West_2014.jpg/1280px-Kim_Kardashian_West_2014.jpg'
  },
  {
    id: 'vip-woman-5',
    name: 'Ariana Grande',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Ariana_Grande_promoting_Wicked_%282024%29.jpg'
  },
  {
    id: 'vip-woman-6',
    name: 'Beyoncé',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg'
  },
  {
    id: 'vip-woman-7',
    name: 'Rihanna',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Rihanna_Fenty_2018.png'
  },
  {
    id: 'vip-woman-8',
    name: 'Zendaya',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Zendaya_-_2019_by_Glenn_Francis.jpg/1280px-Zendaya_-_2019_by_Glenn_Francis.jpg'
  },
  {
    id: 'vip-woman-9',
    name: 'Billie Eilish',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-10',
    name: 'Lady Gaga',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg/1280px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg'
  },
  {
    id: 'vip-woman-11',
    name: 'Jennifer Lopez',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_%28cropped_3%29.jpg'
  },
  {
    id: 'vip-woman-12',
    name: 'Kendall Jenner',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Kendall_Jenner_for_Adanola_2_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-13',
    name: 'Margot Robbie',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Margot_Robbie_at_29th_Critics%27_Choice_Awards.jpg_%28brightened%29.png'
  },
  {
    id: 'vip-woman-14',
    name: 'Emma Watson',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Emma_Watson_2013.jpg'
  },
  {
    id: 'vip-woman-15',
    name: 'Scarlett Johansson',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Scarlett_Johansson-8588.jpg/1280px-Scarlett_Johansson-8588.jpg'
  },
  {
    id: 'vip-woman-16',
    name: 'Gal Gadot',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Gal_Gadot_by_Gage_Skidmore_3.jpg/1280px-Gal_Gadot_by_Gage_Skidmore_3.jpg'
  },
  {
    id: 'vip-woman-17',
    name: 'Dua Lipa',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Dua_Lipa-69798_%28cropped%29.jpg/1280px-Dua_Lipa-69798_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-18',
    name: 'Shakira',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg/1280px-2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg'
  },
  {
    id: 'vip-woman-19',
    name: 'Nicki Minaj',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nicki_Minaj_2025_%283x4_cropped%29.jpg/1280px-Nicki_Minaj_2025_%283x4_cropped%29.jpg'
  },
  {
    id: 'vip-woman-20',
    name: 'Katy Perry',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/KatyPerryWestminst111224_%2881_of_95%29_%2854206733094%29_%28cropped_2%29.jpg/1280px-KatyPerryWestminst111224_%2881_of_95%29_%2854206733094%29_%28cropped_2%29.jpg'
  },
  {
    id: 'vip-woman-21',
    name: 'Olivia Rodrigo',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Glasto2025-546_%28cropped%29_%282%29.jpg'
  },
  {
    id: 'vip-woman-22',
    name: 'Jenna Ortega',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Jenna_Ortega-63799_%28cropped%29.jpg/1280px-Jenna_Ortega-63799_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-23',
    name: 'Madison Beer',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Madison_Beer_%40_Greek_Theatre_L.A._06_13_2024_%2853839434064%29_%28cropped_3x4%29.jpg/1280px-Madison_Beer_%40_Greek_Theatre_L.A._06_13_2024_%2853839434064%29_%28cropped_3x4%29.jpg'
  },
  {
    id: 'vip-woman-24',
    name: 'Miley Cyrus',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Miley_Cyrus_Primavera19_-226_%2848986293772%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-25',
    name: 'Khloé Kardashian',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Khloe_Kardashian_Glamour_2.png'
  },
  {
    id: 'vip-woman-26',
    name: 'Cardi B',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Cardi_B_March_2024.png'
  },
  {
    id: 'vip-woman-27',
    name: 'Hailey Bieber',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Hailey_Bieber_at_WWD_Style_Awards_2026.jpg/1280px-Hailey_Bieber_at_WWD_Style_Awards_2026.jpg'
  },
  {
    id: 'vip-woman-28',
    name: 'Sabrina Carpenter',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Sabrina_Carpenter_-_O2_Arena_2025_-_086_%28cropped_2%29.jpg'
  },
  {
    id: 'vip-woman-29',
    name: 'Sydney Sweeney',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Sydney_Sweeney_at_the_2024_Toronto_International_Film_Festival_%28cropped%2C_rotated%29.jpg'
  },
  {
    id: 'vip-woman-30',
    name: 'Bella Hadid',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Bella_Hadid_at_the_2026_Cannes_Film_Festival_01_%28cropped%29.jpg/1280px-Bella_Hadid_at_the_2026_Cannes_Film_Festival_01_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-31',
    name: 'Gigi Hadid',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Marina_Ruy_Barbosa_com_Gigi_Hadid_em_Paris_%28Gigi_Hadid%29.jpg'
  },
  {
    id: 'vip-woman-32',
    name: 'Doja Cat',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Doja_Cat_x_Amazon1.1_%28cropped%29.jpg/1280px-Doja_Cat_x_Amazon1.1_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-33',
    name: 'Camila Cabello',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Camila_Cabello_Sundance_2024_Cropped_%28cropped%29.jpg/1280px-Camila_Cabello_Sundance_2024_Cropped_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-34',
    name: 'Megan Fox',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Megan_Fox_-_Jennifer%27s_Body.jpg/1280px-Megan_Fox_-_Jennifer%27s_Body.jpg'
  },
  {
    id: 'vip-woman-35',
    name: 'Anya Taylor-Joy',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Anya_Taylor-Joy_at_the_2025_Toronto_International_Film_Festival._06_%28cropped%29.jpg/1280px-Anya_Taylor-Joy_at_the_2025_Toronto_International_Film_Festival._06_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-36',
    name: 'BLACKPINK Lisa',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/20240314_Lisa_Manoban_07.jpg'
  },
  {
    id: 'vip-woman-37',
    name: 'BLACKPINK Jennie',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Jennie_2026_GDA_1.jpg'
  },
  {
    id: 'vip-woman-38',
    name: 'BLACKPINK Rosé',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Blackpink_Ros%C3%A9_Rimowa_1.jpg'
  },
  {
    id: 'vip-woman-39',
    name: 'BLACKPINK Jisoo',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Jisoo_at_Boyfriend_on_Demand_press_conference_on_26022026_%2812%29.png'
  },
  {
    id: 'vip-woman-40',
    name: 'Adele',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Adele_2016.jpg/1280px-Adele_2016.jpg'
  },
  {
    id: 'vip-woman-41',
    name: 'Megan Thee Stallion',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Megan_Thee_Stallion_Adweek_pose.jpg'
  },
  {
    id: 'vip-woman-42',
    name: 'Emma Stone',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emma_Stone_at_the_2025_Venice_Film_Festival-6313_%28cropped%29.jpg/1280px-Emma_Stone_at_the_2025_Venice_Film_Festival-6313_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-43',
    name: 'Natalie Portman',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/NataliePortman.jpg/1280px-NataliePortman.jpg'
  },
  {
    id: 'vip-woman-44',
    name: 'Anne Hathaway',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Anne_Hathaway-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194764955_%28cropped%29.jpg/1280px-Anne_Hathaway-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194764955_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-45',
    name: 'Angelina Jolie',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Angelina_Jolie-643531_%28cropped%29.jpg/1280px-Angelina_Jolie-643531_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-46',
    name: 'Charlize Theron',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Charlize-theron-IMG_6045.jpg/1280px-Charlize-theron-IMG_6045.jpg'
  },
  {
    id: 'vip-woman-47',
    name: 'Deepika Padukone',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Deepika_Padukone_2025_%281%29.png'
  },
  {
    id: 'vip-woman-48',
    name: 'Priyanka Chopra',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Priyanka_Chopra_at_Bulgary_launch%2C_2024_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-49',
    name: 'Alia Bhatt',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Alia_Bhatt_attends_at_the_2026_Cannes_Film_Festival_%28cropped%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-50',
    name: 'Shraddha Kapoor',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Shraddha_Kapoor_promoting_Street_Dancer_3D.jpg'
  },
  {
    id: 'vip-woman-51',
    name: 'Greta Thunberg',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Greta_Thunberg_in_November_in_Stockholm_%28cropped%29%282%29.jpg/1280px-Greta_Thunberg_in_November_in_Stockholm_%28cropped%29%282%29.jpg'
  },
  {
    id: 'vip-woman-52',
    name: 'Ivanka Trump',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Ivanka_Trump_official_portrait_2020.jpg/1280px-Ivanka_Trump_official_portrait_2020.jpg'
  },
  {
    id: 'vip-woman-53',
    name: 'Oprah Winfrey',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Oprah_Winfrey_2016.jpg'
  },
  {
    id: 'vip-woman-54',
    name: 'Kim Petras',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Kim_Petras_%2842743719761%29.jpg'
  },
  {
    id: 'vip-woman-55',
    name: 'Ice Spice',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Ice_Spice_%28color_corrected%29.png'
  },
  {
    id: 'vip-woman-56',
    name: 'SZA',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/KendrickSZASPurs230725-19_-_54683179509_%28cropped%29_%28cropped%29.jpg/1280px-KendrickSZASPurs230725-19_-_54683179509_%28cropped%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-57',
    name: 'Coco Gauff',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Coco_Gauff_Miami_Open.jpg/1280px-Coco_Gauff_Miami_Open.jpg'
  },
  {
    id: 'vip-woman-58',
    name: 'Iga Świątek',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Iga_Swiatek_2023_Cropped_%2B_Retouched.jpg'
  },
  {
    id: 'vip-woman-59',
    name: 'Naomi Osaka',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/NaomiOsaka-smile-2020_%28cropped_tight%29.png/1280px-NaomiOsaka-smile-2020_%28cropped_tight%29.png'
  },
  {
    id: 'vip-woman-60',
    name: 'Simone Biles',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Simone_Biles_National_Team_2024.jpg/1280px-Simone_Biles_National_Team_2024.jpg'
  },
  {
    id: 'vip-woman-61',
    name: 'Ronda Rousey',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Rousey_HOF_2018_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-62',
    name: 'Livvy Dunne',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Olivia_Dunne_2025_%28cropped%29.jpg/1280px-Olivia_Dunne_2025_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-63',
    name: 'Charli D\'Amelio',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Charli_D%27Amelio_3.jpg/1280px-Charli_D%27Amelio_3.jpg'
  },
  {
    id: 'vip-woman-64',
    name: 'Addison Rae',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/LanaWembley030725-144_-_54640470921_%28Addison_Rae%29.jpg'
  },
  {
    id: 'vip-woman-65',
    name: 'Bella Poarch',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Bella_Poarch_-_Pink_Aura_Tour.jpg'
  },
  {
    id: 'vip-woman-66',
    name: 'Pokimane',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Pokimane_sig.svg/1280px-Pokimane_sig.svg.png'
  },
  {
    id: 'vip-woman-67',
    name: 'Valkyrae',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Valkyrae_in_2023_%284x5_cropped%29.png/1280px-Valkyrae_in_2023_%284x5_cropped%29.png'
  },
  {
    id: 'vip-woman-68',
    name: 'Mia Khalifa',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Mia_Khalifa_in_2019.png'
  },
  {
    id: 'vip-woman-69',
    name: 'Paris Hilton',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Paris_Hilton_at_WWD_Style_Awards_2026_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-70',
    name: 'Britney Spears',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Britney_Spears_2013_%28Straighten_Crop%29.jpg'
  },
  {
    id: 'vip-woman-71',
    name: 'Christina Aguilera',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Liberation_Tour_%2845997616942%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-72',
    name: 'Demi Lovato',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Demi_Lovato_Interview_Feb_2020.png'
  },
  {
    id: 'vip-woman-73',
    name: 'Avril Lavigne',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Glaston2024_2806_300624_%28129_of_173%29_%28cropped%29.jpg/1280px-Glaston2024_2806_300624_%28129_of_173%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-74',
    name: 'Hilary Duff',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Hilary_Duff_%2835661671285%29_%28cropped%29_%283%29.jpg'
  },
  {
    id: 'vip-woman-75',
    name: 'Salma Hayek',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/MKr383631_Salma_Hayek_%28Women_In_Motion%2C_Cannes_2025%29_crop.jpg/1280px-MKr383631_Salma_Hayek_%28Women_In_Motion%2C_Cannes_2025%29_crop.jpg'
  },
  {
    id: 'vip-woman-76',
    name: 'Monica Bellucci',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Monica_Bellucci_San_Sebasti%C3%A1n.jpg'
  },
  {
    id: 'vip-woman-77',
    name: 'Penélope Cruz',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Goyas_2024_-_Pen%C3%A9lope_Cruz-2_%28cropped%29.jpg/1280px-Goyas_2024_-_Pen%C3%A9lope_Cruz-2_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-78',
    name: 'Dakota Johnson',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Dakota_Johnson_at_the_2025_Cannes_Film_Festival_%28cropped%29.jpg/1280px-Dakota_Johnson_at_the_2025_Cannes_Film_Festival_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-79',
    name: 'Florence Pugh',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Florence_Pugh_at_the_2024_Toronto_International_Film_Festival_13_%28cropped_2_%E2%80%93_color_adjusted%29.jpg'
  },
  {
    id: 'vip-woman-80',
    name: 'Millie Bobby Brown',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Millie_Bobby_Brown_-_MBB_-_4_-_SFM5_-_July_10%2C_2022_at_Stranger_Fan_Meet_5_People_Convention_%28cropped%29.jpg/1280px-Millie_Bobby_Brown_-_MBB_-_4_-_SFM5_-_July_10%2C_2022_at_Stranger_Fan_Meet_5_People_Convention_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-81',
    name: 'Elle Fanning',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Elle_Fanning_by_Gage_Skidmore_2.jpg/1280px-Elle_Fanning_by_Gage_Skidmore_2.jpg'
  },
  {
    id: 'vip-woman-82',
    name: 'Hunter Schafer',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Hunter_Schafer-64188.jpg/1280px-Hunter_Schafer-64188.jpg'
  },
  {
    id: 'vip-woman-83',
    name: 'Lana Del Rey',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/LanaDRPrimavera310524_%2832_of_147%29_%2853765476960%29_%28cropped%29.jpg/1280px-LanaDRPrimavera310524_%2832_of_147%29_%2853765476960%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-84',
    name: 'Halsey',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/WI%3B_Marathon_County_Map%3B_Town_of_Halsey.png'
  },
  {
    id: 'vip-woman-85',
    name: 'Nessa Barrett',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Nessa_Barrett_Irving_Plaza.jpg'
  },
  {
    id: 'vip-woman-86',
    name: 'Rosalía',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/2023-11-16_Gala_de_los_Latin_Grammy%2C_27_%28cropped%2902_%28cropped%29.jpg/1280px-2023-11-16_Gala_de_los_Latin_Grammy%2C_27_%28cropped%2902_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-87',
    name: 'Karol G',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/2023-11-16_Gala_de_los_Latin_Grammy%2C_15.jpg/1280px-2023-11-16_Gala_de_los_Latin_Grammy%2C_15.jpg'
  },
  {
    id: 'vip-woman-88',
    name: 'Becky G',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Becky_G_2023_01.jpg'
  },
  {
    id: 'vip-woman-89',
    name: 'Sofia Vergara',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Sof%C3%ADa_Vergara_2019_by_Glenn_Francis.jpg/1280px-Sof%C3%ADa_Vergara_2019_by_Glenn_Francis.jpg'
  },
  {
    id: 'vip-woman-90',
    name: 'Eva Longoria',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Eva_Longoria-1384.jpg/1280px-Eva_Longoria-1384.jpg'
  },
  {
    id: 'vip-woman-91',
    name: 'Meryl Streep',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_%28cropped1%29.jpg/1280px-Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_%28cropped1%29.jpg'
  },
  {
    id: 'vip-woman-92',
    name: 'Julia Roberts',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Julia_Roberts_2025.jpg/1280px-Julia_Roberts_2025.jpg'
  },
  {
    id: 'vip-woman-93',
    name: 'Jennifer Aniston',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/16/JenniferAnistonHWoFFeb2012.jpg'
  },
  {
    id: 'vip-woman-94',
    name: 'Candace Owens',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Candace_Owens_%2853804896076%29_%28cropped%29.jpg/1280px-Candace_Owens_%2853804896076%29_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-95',
    name: 'Michelle Obama',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Michelle_Obama_2013_official_portrait.jpg/1280px-Michelle_Obama_2013_official_portrait.jpg'
  },
  {
    id: 'vip-woman-96',
    name: 'Melania Trump',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/64/F20260213AH-3001_%28cropped%29.jpg'
  },
  {
    id: 'vip-woman-97',
    name: 'Pamela Anderson',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Pamela_Anderson_2024_Headshot_by_Norman_Wong.jpg/1280px-Pamela_Anderson_2024_Headshot_by_Norman_Wong.jpg'
  },
  {
    id: 'vip-woman-98',
    name: 'Cameron Diaz',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Cameron_Diaz_at_WWD_Style_Awards_2026-1998.jpg/1280px-Cameron_Diaz_at_WWD_Style_Awards_2026-1998.jpg'
  },
  {
    id: 'vip-woman-99',
    name: 'Jessica Alba',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Jessica_Alba_-_Los_Angeles_Comic_Con_2025.jpg/1280px-Jessica_Alba_-_Los_Angeles_Comic_Con_2025.jpg'
  },
  {
    id: 'vip-woman-100',
    name: 'Eva Mendes',
    gender: 'female',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Eva_Mendes_2009.jpg'
  }
];

export const VIP_CELEBRITIES: VIPCelebrity[] = [...VIP_MEN, ...VIP_WOMEN];
