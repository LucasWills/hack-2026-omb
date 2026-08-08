import memberPhotoPlaceholder from '../assets/shinji.jpeg';

const teamMembers = [
  {
    name: "Lucas Wills",
    role: "Yabai",
    bio: "Yatta"
  },
  {
    name: "Mussie Yigzaw",
   role: "Yabai",
    bio: "Yatta"
  },
  {
    name: "Asher Vicera",
    role: "Yabai",
    bio: "Yatta"
  }
];

export default function TeamMembersSection() {
  return (
    <div className="content-section team-members-section-bg">
      <div className="section-header-block">
        <h2 className="section-main-title">The Collective</h2>
        <p className="section-subtitle">Meet the minds driving the project forward.</p>
      </div>

      <div className="members-list-container">
        {teamMembers.map((member, index) => (
          <div className="member-card" key={index}>
            <div className="member-image-wrapper">
              <img 
                src={memberPhotoPlaceholder} 
                alt={member.name} 
                className="member-img" 
              />
            </div>
            <div className="member-info-wrapper">
              <h3 className="member-name">{member.name}</h3>
              <span className="member-role">{member.role}</span>
              <p className="member-bio">{member.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}