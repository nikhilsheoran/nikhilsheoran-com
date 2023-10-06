interface SocialIconProps {
    type: string;
    link: string;
}

const SocialIcon: React.FC<SocialIconProps> = ({ type, link }) => {
    return (<div className='h-10 w-10 opacity-80 hover:opacity-100 hover:scale-105 transition-all cursor-pointer'>
        <a href={link} target="_blank">
            <img src={`/images/vectors/${type}.svg`} alt={`${type}-icon`} />
        </a>
    </div>);
}

export default SocialIcon;