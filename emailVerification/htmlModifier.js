const titleId = document.getElementById("titleId");
const dateId = document.getElementById("dateId");
const descriptionId = document.getElementById("dateId");
const blogImageId = document.getElementById("blogImageId");
console.log(titleId.textContent);

const htmlContentFunction = (content) => {
  const { name, title, description, dateObject, blogImage } = content;
  return (
    <div>
      <div>
        <img
          src="https://aapmor.com/assets/img/aapmore-logo-.jpg"
          alt="aapmor-logo"
        />
        <h1>Weekly NewsLetter</h1>
      </div>
      <hr />
      <div>
        <p>@newsletter</p>
        <p>Aapmor Technologies</p>
        <p>06-11-2023</p>
      </div>
      <hr />
      <h1>
        The Power of Mindfulness: Transform Your Life with Present Moment
        Awareness
      </h1>
      <div>
        <img
          src="https://static.wixstatic.com/media/72c0b2_58cde2ebb708454fb4aa74c2b5c1b648~mv2.png/v1/fill/w_1000,h_571,al_c,q_90,usm_0.66_1.00_0.01/72c0b2_58cde2ebb708454fb4aa74c2b5c1b648~mv2.png"
          alt="blog-image"
        />
        <div>
          <p>
            In today's fast-paced world, it's easy to get caught up in the chaos
            of daily life. We're constantly juggling work, family, and personal
            commitments, often feeling overwhelmed and stressed. This is where
            the practice of mindfulness can make a significant difference.
            <br />
            Mindfulness is the art of being present in the moment, fully aware
            of your thoughts, feelings, and surroundings without judgment. It's
            a simple concept, but its impact on our lives can be profound. In
            this blog, we'll explore how practicing mindfulness can help you
            transform your life and achieve a sense of inner peace and
            fulfillment
          </p>
          <button>
            <a href="http://localhost:3000/blogs/6549d7e2dce4dcd901e0ef81">
              Continue Reading...
            </a>
          </button>
        </div>
      </div>
    </div>
  );
};

exports.htmlContentFunction = htmlContentFunction;
