import Image from 'next/image'
import AboutCard from './components/AboutCard'
import SocialIcon from './components/SocialIcon'

export default function Home() {
  return (
    <main className="mb-9">
      <div className='hidden 2xl:flex flex-col gap-10 fixed left-14 top-1/2 -translate-y-1/2'>
        <SocialIcon type={"x"} link={"https://x.com/_nikhilsheoran"} />
        <SocialIcon type={"linkedin"} link={"https://linkedin.com/in/nikhilsheoran"} />
        <SocialIcon type={"instagram"} link={"https://instagram.com/thenikhilsheoran"} />
        <SocialIcon type={"youtube"} link={"https://youtube.com/@thenikhilsheoran"} />
      </div>
      <div className='flex justify-center items-center gap-20 my-8 sm:my-16 lg:my-24 xl:my-32'>
        <div className="hidden lg:block relative w-[250px] xl:w-[390px] rounded-[40px] overflow-clip"
          style={{
            boxShadow: '0px 0px 10px 2px rgba(0, 0, 0, 0.20)',
          }}>
          <Image
            src={`/images/nikhil.png`}
            alt={`nikhil-image`}
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        <div className='flex flex-col gap-6 md:gap-9 lg:gap-6'>
          <div className='flex flex-col items-center lg:items-start'>
            <div className='text-3xl sm:text-4xl'>Hey, I&apos;m</div>
            <div className='text-center lg:text-left text-6xl sm:text-7xl xl:text-8xl font-bold'>Nikhil Sheoran.</div>
          </div>
          <div className="lg:hidden relative m-auto w-[300px] md:w-[500px] rounded-[40px] overflow-clip"
            style={{
              boxShadow: '0px 0px 10px 2px rgba(0, 0, 0, 0.20)',
            }}>
            <Image
              src={`/images/nikhil.png`}
              alt={`nikhil-image`}
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          <div className='flex gap-6 flex-wrap justify-center lg:justify-start mx-2'>
            <AboutCard icon="tech" text="tech enthusiast" />
            <AboutCard icon="student" text="student" />
            <AboutCard icon="speedcuber" text="speedcuber" />
          </div>
          <div className='flex gap-6 flex-wrap justify-center lg:justify-start mx-2'>
            <AboutCard icon="design" text="design" />
            <AboutCard icon="editor" text="video editor" />
          </div>
        </div>
      </div>
      <div className='flex justify-center m-auto px-4 text-xl sm:text-2xl font-light max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl'>
        <p>
          I&apos;m a 17-year-old student pursuing an Electronics and Communication engineering degree at <a href="https://www.bits-pilani.ac.in/goa/" target="_blank" className='gold-underline'>BITS Goa</a>.
          <br />
          <br />
          Currently, I&apos;m working on two big life projects: <a href="https://mediagroww.com/" target="_blank" className='gold-underline'>Media Groww</a> (a YouTube agency) and <a href="https://fastcutai.co/" target="_blank" className='gold-underline'>FastCut</a> (a software product to create engaging reels quickly).

          <br />
          <br />
          <b>
            This is how it all started:
          </b>
          <br />
          <br />
          Highly inspired by Ali Abdaal and a bunch of other youtubers, I decided to start a <a href="https://www.youtube.com/@codeleyout6175" target="_blank" className='gold-underline'>YouTube channel</a> back in 2021. Initially, wanted to post web dev tutorials, but realized how hard it is, and gave up just after posting the intro video. 🥹
          <br />
          <br />
          But the desire resurfaced in Feb 2022, when I posted another <a href="https://www.youtube.com/watch?v=krWeNv1GvSY" target="_blank" className='gold-underline'>video</a> on a new channel. (This time, inspired by <a href="https://www.youtube.com/@MikeShake" target="_blank" className='gold-underline'>Mike Shake</a> :p)
          <br />
          Soon, Class 12<sup>th</sup> pre-board exams came by, and I had to, once again give up on my dream of becoming a YouTuber.
          <br />
          <br />
          Fast Forward to Sept 2022, when I decided it&apos;s time to take things seriously. Entrance exams were all done and I was ready to become a YouTuber this time. This marked my entry into video editing, which as I dived deeper into, I started to enjoy a lot.
          <br />
          <br />
          In December, a senior from my college asked me to edit a <a href="https://www.youtube.com/watch?v=tlNIHky7ZHI" target="_blank" className='gold-underline'>video</a> for his channel. This was a paid gig. I immidiately agreed. And that&apos;s how I made my <a href="https://twitter.com/_nikhilsheoran/status/1604491342482214913" target="_blank" className='gold-underline'>first dollar</a>.

          <br />
          <br />
          I&apos;ve always been interested in doing something of my own, rather than working for someone else. That <a href="https://www.youtube.com/shorts/sKaP7oxbdAo" target="_blank" className='gold-underline'>urge</a> led to the beginning of Media Groww in April 2023, along with <a href="https://twitter.com/JeetKalita719" target="_blank" className='gold-underline'>Jeet</a>.
          <br />
          <br />
          It&apos;s been six months since. The agency has grown to 5 active clients, and close to $1k MRR. (that&apos;s when 50% ownership hurts 😭🤣)
          In fact, one of my plans for the next half of the financial year is to at least 5x this number.
          <br />
          <br />
          Anyway, while editing for clients, I noticed a specific client need: short form video edits like hormozi style <a href="https://www.youtube.com/watch?v=X4DNdM8jSQY" target="_blank" className='gold-underline'>editing</a> among others. This can be automated using code. And that&apos;s how the idea for FastCut came around.
          <br />
          <br />
          I started building FastCut with <a href="https://twitter.com/hashtodi" target="_blank" className='gold-underline'>Harsh</a>. The MVP is almost ready and we&apos;ll launch soon. 🥳
          <br />
          <br />
          Nowadays, I make videos on YouTube, mainly sharing the lessons I learn along the way while trying new stuff. I&apos;m not very consistent, although I try to be.
          <br />
          <br />
          That was my story so far.
          If there&apos;s something you want to discuss about, the best way to reach me is through <a href="mailto:nikhil@nikhilsheoran.com" target="_blank" className='gold-underline'>e-mail</a>.
          <br />
          <br />
          Last updated: 6 October 2023.
          <br />
          <br />
          ps: Website is inspired by - <a href="https://fold.money/" target="_blank" className='gold-underline'>Fold</a>, <a href="https://kunal.tech/" target="_blank" className='gold-underline'>Kunal</a>, <a href="https://framer.com/" target="_blank" className='gold-underline'>Framer</a> and <a href="https://aliabdaal.com/" target="_blank" className='gold-underline'>Ali Abdaal</a>.
        </p>
      </div>
      <div className='flex gap-10 2xl:hidden justify-center items-center mt-14 mb-6'>
        <SocialIcon type={"x"} link={"https://x.com/_nikhilsheoran"} />
        <SocialIcon type={"linkedin"} link={"https://linkedin.com/in/nikhilsheoran"} />
        <SocialIcon type={"instagram"} link={"https://instagram.com/thenikhilsheoran"} />
        <SocialIcon type={"youtube"} link={"https://youtube.com/@thenikhilsheoran"} />
      </div>
    </main>
  )
}
