interface AboutCardProps {
  icon: string;
  text: string;
}

const AboutCard: React.FC<AboutCardProps> = ({ icon, text }) => {
  var link;

  switch (icon) {
    case "tech":
      link = "http://github.com/nikhilsheoran";
      break;
    case "student":
      link = "https://www.youtube.com/watch?v=oawuPeaBOMc";
      break;
    case "speedcuber":
      link = "https://www.youtube.com/shorts/9BAOak6PotE";
      break;
    case "design":
      link = "/";
      break;
    case "editor":
      link = "http://youtube.com/@thenikhilsheoran";
      break;
  }
  return (
    <a href={link} target="_blank">
      <div className="flex w-fit gap-3 items-center py-2 px-4 rounded-[7px] outline outline-3 outline-[#BBBFD4] cursor-pointer hover:-translate-y-1 transition"
        style={{
          boxShadow: '0px 1px 10px 0px rgba(0, 0, 0, 0.10)',
        }}>
        <div className="w-6 h-6">
          <img src={`/images/vectors/${icon}.svg`} alt="" />
        </div>
        <div className="text-xl sm:text-2xl font-medium">{text}</div>
      </div>
    </a>
  );
};


export default AboutCard;