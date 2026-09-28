(function () {
  "use strict";

  const course = window.PyCourse = {
    title: "Python Learning Lab",
    version: "1.0",
    release: "October 2026",
    lastVerified: "2026-09-28",
    author: "Namiranian, Babak",
    storageKey: "python-learning-lab-v1",
    modules: [],
    resources: []
  };

  course.code = lines => lines.join("\n");
  course.addModule = definition => {
    const number = course.modules.length + 1;
    const module = {
      id: `PY-${String(number).padStart(3, "0")}`,
      number,
      minutes: 90,
      prerequisites: [],
      domains: ["Core"],
      outcomes: [], chapters: [], checks: [], resources: [],
      ...definition
    };
    course.modules.push(module);
    return module;
  };

  const addResource = resource => course.resources.push({
    access: "Free",
    status: "Living documentation",
    verified: course.lastVerified,
    ...resource
  });

  [
    {id:"python-docs",title:"Python 3 documentation",provider:"Python Software Foundation",kind:"Official documentation",url:"https://docs.python.org/3/",bestFor:"The current stable language tutorial, library reference, language reference and setup guidance.",scope:"The editionless /3/ URL follows the current stable Python 3 documentation."},
    {id:"python-tutorial",title:"The Python Tutorial",provider:"Python Software Foundation",kind:"Official tutorial",url:"https://docs.python.org/3/tutorial/",bestFor:"A primary-source tour of syntax, data structures, modules, errors, classes and the standard library.",scope:"Living stable-version tutorial."},
    {id:"python-download",title:"Download Python",provider:"Python Software Foundation",kind:"Official download",url:"https://www.python.org/downloads/",bestFor:"Current installers and platform-specific installation guidance.",scope:"The main download action follows the current production release."},
    {id:"python-howto",title:"Python HOWTOs",provider:"Python Software Foundation",kind:"Official documentation",url:"https://docs.python.org/3/howto/",bestFor:"Focused explanations of logging, sorting, regex, descriptors, functional techniques and more.",scope:"Living stable-version documentation."},
    {id:"pep-index",title:"Python Enhancement Proposals",provider:"Python Software Foundation",kind:"Specification",url:"https://peps.python.org/",bestFor:"Language, packaging, typing and process specifications with status and rationale.",scope:"Living index; each PEP records its own status."},
    {id:"vscode-python",title:"Python in Visual Studio Code",provider:"Microsoft",kind:"Official documentation",url:"https://code.visualstudio.com/docs/languages/python",bestFor:"Installing the extension, selecting interpreters, running, debugging, testing and environment management.",scope:"Living documentation for current VS Code and extensions."},
    {id:"vscode-start",title:"Getting Started with Python in VS Code",provider:"Microsoft",kind:"Official tutorial",url:"https://code.visualstudio.com/docs/python/python-tutorial",bestFor:"A platform-aware first project, environment, package, run and debug walkthrough.",scope:"Living tutorial."},
    {id:"vscode-env",title:"Python environments in VS Code",provider:"Microsoft",kind:"Official documentation",url:"https://code.visualstudio.com/docs/python/environments",bestFor:"Discovering, creating and switching venv, conda, pyenv, Poetry and other environments.",scope:"Living documentation."},
    {id:"packaging",title:"Python Packaging User Guide",provider:"PyPA",kind:"Official documentation",url:"https://packaging.python.org/en/latest/",bestFor:"Current packaging, dependency management, pyproject.toml, builds and publishing.",scope:"The /latest/ path follows the current guide."},
    {id:"pytest",title:"pytest documentation",provider:"pytest",kind:"Official documentation",url:"https://docs.pytest.org/en/stable/",bestFor:"Fixtures, parametrization, markers, plugins and test design.",scope:"The /stable/ alias follows the current stable docs."},
    {id:"typing",title:"Typing specification",provider:"Python typing community",kind:"Specification",url:"https://typing.python.org/en/latest/spec/",bestFor:"The authoritative behavior expected from Python type checkers.",scope:"Living specification."},
    {id:"fastapi",title:"FastAPI documentation",provider:"FastAPI",kind:"Official documentation",url:"https://fastapi.tiangolo.com/",bestFor:"Typed APIs, validation, dependencies, security, testing and deployment.",scope:"Living documentation; check installed package versions for behavior-sensitive code."},
    {id:"flask",title:"Flask documentation",provider:"Pallets",kind:"Official documentation",url:"https://flask.palletsprojects.com/",bestFor:"Small web applications, request handling, application factories, testing and deployment.",scope:"The main documentation URL presents supported releases."},
    {id:"django",title:"Django documentation",provider:"Django Software Foundation",kind:"Official documentation",url:"https://docs.djangoproject.com/",bestFor:"The batteries-included web framework, ORM, admin, forms, security and deployment.",scope:"Landing page links current and supported version documentation."},
    {id:"postgres",title:"PostgreSQL current tutorial",provider:"PostgreSQL",kind:"Official tutorial",url:"https://www.postgresql.org/docs/current/tutorial.html",bestFor:"Relational design, SQL, joins, transactions and constraints.",scope:"The /current/ alias follows current PostgreSQL documentation."},
    {id:"numpy",title:"NumPy documentation",provider:"NumPy",kind:"Official documentation",url:"https://numpy.org/doc/stable/",bestFor:"Arrays, vectorization, broadcasting, indexing, random sampling and numerical APIs.",scope:"The /stable/ alias follows the stable docs."},
    {id:"pandas",title:"pandas documentation",provider:"pandas",kind:"Official documentation",url:"https://pandas.pydata.org/docs/",bestFor:"Tabular ingestion, cleaning, transformation, grouping, joining and time series.",scope:"Landing page separates stable and development docs."},
    {id:"matplotlib",title:"Matplotlib documentation",provider:"Matplotlib",kind:"Official documentation",url:"https://matplotlib.org/stable/",bestFor:"Publication-quality plots and the object-oriented figure/axes interface.",scope:"The /stable/ alias follows stable docs."},
    {id:"jupyter",title:"Project Jupyter documentation",provider:"Project Jupyter",kind:"Official documentation",url:"https://docs.jupyter.org/en/latest/",bestFor:"Notebook workflows, kernels, security and the wider Jupyter ecosystem.",scope:"Living documentation."},
    {id:"sklearn",title:"scikit-learn User Guide",provider:"scikit-learn",kind:"Official documentation",url:"https://scikit-learn.org/stable/user_guide.html",bestFor:"Preprocessing, models, pipelines, evaluation, inspection and common pitfalls.",scope:"The /stable/ alias follows the stable docs."},
    {id:"tensorflow",title:"TensorFlow guides",provider:"Google",kind:"Official documentation",url:"https://www.tensorflow.org/guide",bestFor:"TensorFlow/Keras tensors, models, training, data pipelines and distributed execution.",scope:"Living documentation; record package version for reproducibility."},
    {id:"pytorch",title:"PyTorch documentation",provider:"PyTorch Foundation",kind:"Official documentation",url:"https://pytorch.org/docs/stable/index.html",bestFor:"Tensors, autograd, neural networks, data loading and distributed training.",scope:"Stable documentation; record package and accelerator versions."},
    {id:"huggingface",title:"Hugging Face course",provider:"Hugging Face",kind:"Free course",url:"https://huggingface.co/learn",bestFor:"Transformers, NLP, LLMs, agents, computer vision and open-model workflows.",scope:"Living course; individual tracks evolve."},
    {id:"owasp-api",title:"REST Security Cheat Sheet",provider:"OWASP",kind:"Security guidance",url:"https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html",bestFor:"Transport, access control, validation, HTTP semantics and operational controls.",scope:"Living community security guidance."},
    {id:"docker",title:"Docker Get Started",provider:"Docker",kind:"Official tutorial",url:"https://docs.docker.com/get-started/",bestFor:"Containers, images, multi-stage builds and reproducible delivery.",scope:"Living documentation.",access:"Freemium — documentation is free; product and hosted-service terms vary"},
    {id:"actions",title:"GitHub Actions documentation",provider:"GitHub",kind:"Official documentation",url:"https://docs.github.com/en/actions",bestFor:"Automated tests, builds, security checks and deployment workflows.",scope:"Living documentation.",access:"Freemium — public and account quotas vary"},
    {id:"automate-book",title:"Automate the Boring Stuff with Python",provider:"Al Sweigart",kind:"Book",url:"https://automatetheboringstuff.com/",bestFor:"Practical scripting projects for files, spreadsheets, web tasks and desktop automation.",scope:"Online book; verify package APIs against current official docs.",access:"Free online; paid print and course options are optional"},
    {id:"think-python",title:"Think Python",provider:"Allen B. Downey",kind:"Book",url:"https://allendowney.github.io/ThinkPython/",bestFor:"A thoughtful introduction to programming, functions, data structures and design.",scope:"Online edition maintained by the author.",access:"Free online; paid print edition optional"},
    {id:"coursera-python",title:"Python for Everybody",provider:"Coursera / University of Michigan",kind:"Guided course",url:"https://www.coursera.org/specializations/python",bestFor:"A structured beginner sequence covering programming, data, web access and databases.",scope:"Hosted course; compare tools and APIs with current official docs.",access:"Freemium/Paid — audit, subscription and certificate terms vary"},
    {id:"coursera-ml",title:"Machine Learning Specialization",provider:"Coursera / DeepLearning.AI",kind:"Guided course",url:"https://www.coursera.org/specializations/machine-learning-introduction",bestFor:"Guided machine-learning foundations with Python practice.",scope:"Hosted course; enrollment and tool versions can change.",access:"Freemium/Paid — audit, subscription and certificate terms vary"},
    {id:"youtube-python",title:"Python for Beginners — Full Course",provider:"freeCodeCamp.org",kind:"YouTube tutorial",url:"https://www.youtube.com/watch?v=rfscVS0vtbw",bestFor:"A visual introduction to core syntax and small programs.",scope:"Older recording; verify installation and library details against current docs."},
    {id:"youtube-vscode",title:"Visual Studio Code official channel",provider:"Microsoft",kind:"YouTube channel",url:"https://www.youtube.com/@code",bestFor:"Current editor, debugging, testing and extension demonstrations.",scope:"Living channel; verify OS-specific shortcuts in current documentation."},
    {id:"exercism",title:"Python track",provider:"Exercism",kind:"Practice",url:"https://exercism.org/tracks/python",bestFor:"Small exercises, concept practice and community mentoring.",scope:"Living curriculum."}
  ].forEach(addResource);
})();
