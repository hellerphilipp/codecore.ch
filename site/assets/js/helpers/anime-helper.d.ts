
type AnimeTimelineHelperCallback = (el: Element, options?: any) => anime.AnimeTimelineInstance;

declare const defineAnimeTimelineHelper: (
    name: string,
    fn: AnimeTimelineHelperCallback
) => void;

type AnimeHelperRunOptions = {
    media?: string | string[];
    timeline?: string;
    targets?: string;
    onclick?: boolean | string;
    onhover?: boolean;
    onview?: boolean | number;
    onscroll?: boolean | (import('scrollmagic').SceneConstructorOptions & {
        target?: string;
        controller?: import('scrollmagic').ControllerConstructorOptions,
        pen?: boolean | string,
    });
    autoplay?: boolean;
};

declare module anime {
    interface AnimeInstance extends ReturnType<typeof import('animejs')> {
        reset(): void;
    }
    interface AnimeTimelineInstance extends ReturnType<typeof import('animejs')['timeline']> {
        reset(): void;
    }
}
